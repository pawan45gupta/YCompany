import { NextResponse } from "next/server";
import { parseForgotPasswordBody } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { findUserByEmail } from "@/lib/users/store";
import {
  buildResetUrl,
  issueResetToken,
} from "@/lib/auth/password-reset";
import { apiMessage } from "@/i18n/api";

// Tighter than signup — issuing reset tokens is more sensitive (emails out,
// invalidates prior tokens). 5 per IP per minute leaves room for retries
// while frustrating spray attacks.
const LIMIT = 5;
const WINDOW_MS = 60_000;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local"
  );
}

function getBaseUrl(req: Request): string {
  return (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    new URL(req.url).origin
  );
}

export async function POST(req: Request) {
  const limited = rateLimit(`forgot:${clientIp(req)}`, LIMIT, WINDOW_MS);
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseForgotPasswordBody(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Privacy: we *always* return the same success shape regardless of
  // whether the email is on file. This avoids leaking account existence
  // — an attacker who scrapes signup error messages gets nothing extra
  // from probing the forgot endpoint.
  const user = findUserByEmail(parsed.email);
  if (user) {
    const { token, expiresAt } = issueResetToken(user.id);
    const resetUrl = buildResetUrl(token, getBaseUrl(req));

    // No real email transport yet. Log the URL on the server so a
    // developer (or a future SMTP/Resend adapter) can pick it up.
    // The token is intentionally *not* echoed back to the client.
    // Single line, easy to grep: `[auth] password reset for …`
    console.info(
      `[auth] password reset for ${user.email} → ${resetUrl} ` +
        `(expires ${new Date(expiresAt).toISOString()})`,
    );
  }

  return NextResponse.json({ ok: true });
}
