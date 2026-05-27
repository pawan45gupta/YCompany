import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  buildLinesFromMetadata,
  createOrderFromCheckout,
} from "@/lib/orders/service";
import { nrRecordEvent } from "@/lib/observability/newrelic-server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("STRIPE_WEBHOOK_SECRET not set; webhook disabled");
    return NextResponse.json({ received: true });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    console.error("Stripe webhook signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkout = event.data.object as Stripe.Checkout.Session;
      const lines = buildLinesFromMetadata(checkout.metadata?.items);
      const email =
        checkout.customer_email ??
        checkout.customer_details?.email ??
        "";
      const userId = checkout.metadata?.userId ?? "guest";

      if (lines?.length && email) {
        const subtotalCents = lines.reduce(
          (s, l) => s + l.unitPriceCents * l.quantity,
          0,
        );
        createOrderFromCheckout({
          userId,
          customerEmail: email,
          stripeSessionId: checkout.id,
          lines,
          subtotalCents,
          shippingCents: Math.max(0, (checkout.total_details?.amount_shipping ?? 0)),
          discountCents: Math.max(0, checkout.total_details?.amount_discount ?? 0),
          totalCents: checkout.amount_total ?? subtotalCents,
          currency: checkout.currency ?? "usd",
        });
        // Authoritative Purchase event: GA4 also fires Purchase from the
        // checkout-success page, but the webhook fires once per *paid*
        // session — making this the only signal that's robust against the
        // user closing the tab on the success screen.
        void nrRecordEvent("Purchase", {
          transaction_id: checkout.id,
          user_id: userId,
          total_cents: checkout.amount_total ?? subtotalCents,
          subtotal_cents: subtotalCents,
          shipping_cents: Math.max(0, checkout.total_details?.amount_shipping ?? 0),
          discount_cents: Math.max(0, checkout.total_details?.amount_discount ?? 0),
          currency: checkout.currency ?? "usd",
          item_count: lines.length,
          item_quantity: lines.reduce((s, l) => s + l.quantity, 0),
          coupon: checkout.metadata?.coupon ?? "",
        });
      }

      console.info("Paid order", checkout.id, checkout.amount_total, checkout.currency);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
