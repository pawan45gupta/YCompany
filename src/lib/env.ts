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

// ---- Auth: signup / forgot / reset ----------------------------------------
// Password policy: ≥8 chars, ≤200 chars, must contain a letter and a digit.
// Stricter than NIST's hard floor (8) but lenient enough not to push users
// toward predictable variants. The same regex is mirrored on the client by
// `evaluatePassword()` in `src/lib/auth/password-policy.ts`.
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

const signupBody = z.object({
  email: z.string().email().max(200),
  password: passwordSchema,
  name: z.string().trim().max(100).optional(),
});

export type SignupBody = z.infer<typeof signupBody>;
export function parseSignupBody(json: unknown): SignupBody {
  return signupBody.parse(json);
}

const forgotPasswordBody = z.object({
  email: z.string().email().max(200),
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordBody>;
export function parseForgotPasswordBody(json: unknown): ForgotPasswordBody {
  return forgotPasswordBody.parse(json);
}

const resetPasswordBody = z.object({
  // Tokens are 32-byte base64url → 43 chars. Allow a small range either side
  // in case the encoding changes.
  token: z.string().min(20).max(128),
  password: passwordSchema,
});

export type ResetPasswordBody = z.infer<typeof resetPasswordBody>;
export function parseResetPasswordBody(json: unknown): ResetPasswordBody {
  return resetPasswordBody.parse(json);
}
