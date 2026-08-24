import { NextResponse } from "next/server";
import { parseSignupBody } from "@/lib/env";
import {
  nrRecordEvent,
  nrSetUserId,
} from "@/lib/observability/newrelic-server";
import { rateLimit } from "@/lib/rate-limit";
import { createUser } from "@/lib/users/store";
import { apiMessage } from "@/i18n/api";

// Rate limit: 10 signups per IP per minute. Generous enough for honest
// retries after a validation error, tight enough to slow obvious abuse.
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
  const limited = rateLimit(`signup:${clientIp(req)}`, LIMIT, WINDOW_MS);
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
    parsed = parseSignupBody(body);
  } catch (err) {
    // Zod's first issue gives the most actionable hint (e.g. "Password must
    // contain a number"). Don't leak the whole tree, but do surface that one.
    const msg =
      err && typeof err === "object" && "issues" in err
        ? // @ts-expect-error - narrowed at runtime
          err.issues?.[0]?.message ?? apiMessage("invalidPayload")
        : apiMessage("invalidPayload");
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const result = await createUser({
    email: parsed.email,
    password: parsed.password,
    name: parsed.name ?? null,
  });

  if (!result.ok) {
    // "email_taken" is the only failure mode createUser can return today.
    // We return 409 (Conflict) which is the conventional status for
    // unique-constraint violations and gives the client a clean branch.
    void nrRecordEvent("SignupRejected", {
      reason: result.reason,
      email_domain: parsed.email.split("@")[1] ?? "unknown",
    });
    return NextResponse.json(
      { error: apiMessage("emailTaken") },
      { status: 409 },
    );
  }

  void nrSetUserId(result.user.id);
  void nrRecordEvent("Signup", {
    user_id: result.user.id,
    email_domain: parsed.email.split("@")[1] ?? "unknown",
    has_name: Boolean(result.user.name),
  });
  return NextResponse.json({ user: result.user }, { status: 201 });
}
