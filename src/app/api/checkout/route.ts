import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { products } from "@/data/products";
import { applyCoupon } from "@/lib/coupons";
import { isStripeConfigured, parseCheckoutBody } from "@/lib/env";
import { nrRecordEvent } from "@/lib/observability/newrelic-server";
import { rateLimit } from "@/lib/rate-limit";
import { apiMessage } from "@/i18n/api";
import { resolveSiteUrl } from "@/lib/site-url";
import { getStripe } from "@/lib/stripe";

const SHIPPING_CENTS = 599;

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local";
  const limited = rateLimit(`checkout:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: apiMessage("tooManyRequests"), retryAfter: limited.retryAfter },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: apiMessage("invalidJson") }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseCheckoutBody(body);
  } catch {
    return NextResponse.json({ error: apiMessage("invalidPayload") }, { status: 400 });
  }

  const session = await auth();
  const email =
    session?.user?.email ?? parsed.customerEmail ?? undefined;
  if (!email) {
    return NextResponse.json(
      { error: apiMessage("emailRequired") },
      { status: 400 },
    );
  }

  if (parsed.items.length === 0) {
    return NextResponse.json({ error: apiMessage("cartEmpty") }, { status: 400 });
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  let subtotalCents = 0;
  const lineItems: {
    price_data: {
      currency: string;
      product_data: { name: string; images?: string[] };
      unit_amount: number;
    };
    quantity: number;
  }[] = [];

  for (const line of parsed.items) {
    const product = byId.get(line.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Unknown product: ${line.productId}` },
        { status: 400 },
      );
    }
    subtotalCents += product.priceCents * line.quantity;
    lineItems.push({
      price_data: {
        currency: product.currency,
        product_data: {
          name: product.name,
          images: [product.image],
        },
        unit_amount: product.priceCents,
      },
      quantity: line.quantity,
    });
  }

  let discountCents = 0;
  let freeShipping = false;
  if (parsed.couponCode?.trim()) {
    const c = applyCoupon(parsed.couponCode, subtotalCents);
    if (!c.valid) {
      return NextResponse.json({ error: c.message }, { status: 400 });
    }
    discountCents = c.discountCents;
    freeShipping = c.freeShipping;
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY (and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) to .env.local from https://dashboard.stripe.com/test/apikeys — then restart the dev server.",
      },
      { status: 503 },
    );
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: apiMessage("stripeInitFailed") },
      { status: 503 },
    );
  }

  const shippingCents = freeShipping ? 0 : SHIPPING_CENTS;

  try {
    const discounts =
      discountCents > 0
        ? [
            {
              coupon: (
                await stripe.coupons.create({
                  amount_off: discountCents,
                  currency: "usd",
                  duration: "once",
                  name: "Order discount",
                })
              ).id,
            },
          ]
        : undefined;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: lineItems,
      discounts,
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB"] },
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: freeShipping
              ? "Standard (complimentary)"
              : "Standard",
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingCents,
              currency: "usd",
            },
          },
        },
      ],
      success_url: `${resolveSiteUrl(req)}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${resolveSiteUrl(req)}/cart`,
      automatic_tax: { enabled: false },
      metadata: {
        coupon: parsed.couponCode?.trim() ?? "",
        userId: session?.user?.id ?? "",
        items: JSON.stringify(parsed.items),
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: apiMessage("checkoutSessionFailed") },
        { status: 500 },
      );
    }

    void nrRecordEvent("BeginCheckout", {
      session_id: checkoutSession.id,
      user_id: session?.user?.id ?? "guest",
      item_count: parsed.items.length,
      item_quantity: parsed.items.reduce((s, i) => s + i.quantity, 0),
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      shipping_cents: shippingCents,
      currency: "usd",
      coupon: parsed.couponCode?.trim().toUpperCase() ?? "",
      free_shipping: freeShipping,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const { reportError } = await import("@/lib/observability/errors");
    reportError(err, { tags: { route: "checkout" } });
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "Payment session could not be created";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
