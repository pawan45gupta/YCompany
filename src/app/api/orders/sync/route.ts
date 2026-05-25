import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStripeConfigured } from "@/lib/env";
import {
  buildLinesFromMetadata,
  createOrderFromCheckout,
} from "@/lib/orders/service";
import { getStripe } from "@/lib/stripe";

/** Record a completed Stripe Checkout session as an order (dev / webhook fallback). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkout.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const email = checkout.customer_email ?? checkout.customer_details?.email;
    if (
      email?.toLowerCase() !== session.user.email?.toLowerCase() &&
      checkout.metadata?.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Session does not belong to this account" }, { status: 403 });
    }

    const lines = buildLinesFromMetadata(checkout.metadata?.items);
    if (!lines?.length) {
      return NextResponse.json({ error: "Could not read order items" }, { status: 400 });
    }

    const subtotalCents = lines.reduce(
      (s, l) => s + l.unitPriceCents * l.quantity,
      0,
    );
    const totalCents = checkout.amount_total ?? subtotalCents;
    const discountCents = Math.max(0, subtotalCents - totalCents);

    const order = createOrderFromCheckout({
      userId: session.user.id,
      customerEmail: session.user.email,
      stripeSessionId: sessionId,
      lines,
      subtotalCents,
      shippingCents: 0,
      discountCents,
      totalCents,
      currency: checkout.currency ?? "usd",
    });

    return NextResponse.json({ order });
  } catch (err) {
    console.error("Order sync error:", err);
    return NextResponse.json({ error: "Could not sync order" }, { status: 502 });
  }
}
