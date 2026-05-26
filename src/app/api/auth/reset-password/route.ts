import { NextResponse } from "next/server";
import { parseResetPasswordBody } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { consumeResetToken } from "@/lib/auth/password-reset";
import { updatePassword } from "@/lib/users/store";
import { apiMessage } from "@/i18n/api";

const LIMIT = 10;
const WINDOW_MS = 60_000;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local"
  );
}

export async function POST(req: Request) {
  const limited = rateLimit(`reset:${clientIp(req)}`, LIMIT, WINDOW_MS);
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
    parsed = parseResetPasswordBody(body);
  } catch (err) {
    const msg =
      err && typeof err === "object" && "issues" in err
        ? // @ts-expect-error - narrowed at runtime
          err.issues?.[0]?.message ?? "Invalid payload"
        : "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Atomic verify + consume. A second submit with the same token will
  // hit `not_found` here even if the password change below succeeded the
  // first time — exactly the single-use semantics we want.
  const userId = consumeResetToken(parsed.token);
  if (!userId) {
    return NextResponse.json(
      { error: apiMessage("resetTokenInvalid") },
      { status: 400 },
    );
  }

  const updated = await updatePassword(userId, parsed.password);
  if (!updated) {
    // User was deleted between issuing the token and consuming it.
    return NextResponse.json(
      { error: apiMessage("resetTokenInvalid") },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
