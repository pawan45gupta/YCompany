import { z } from "zod";

/** True when a Stripe secret key is present (avoids throwing during env checks). */
export function isStripeConfigured(): boolean {
  const k = process.env.STRIPE_SECRET_KEY;
  return Boolean(k && k.startsWith("sk_"));
}

/** Call from API routes / server actions that need Stripe. */
export function requireStripeSecret(): string {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k || !k.startsWith("sk_")) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return k;
}

const checkoutBody = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive().max(99),
    }),
  ),
  couponCode: z.string().max(64).optional(),
  customerEmail: z.string().email().optional(),
});

export type CheckoutBody = z.infer<typeof checkoutBody>;

export function parseCheckoutBody(json: unknown): CheckoutBody {
  return checkoutBody.parse(json);
}

const couponBody = z.object({
  code: z.string().min(1).max(64),
  subtotalCents: z.number().int().nonnegative(),
});

export function parseCouponBody(json: unknown) {
  return couponBody.parse(json);
}
