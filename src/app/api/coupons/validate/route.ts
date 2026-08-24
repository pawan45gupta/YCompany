import { NextResponse } from "next/server";
import { applyCoupon } from "@/lib/coupons";
import { parseCouponBody } from "@/lib/env";
import { nrRecordEvent } from "@/lib/observability/newrelic-server";
import { rateLimit } from "@/lib/rate-limit";
import { apiMessage } from "@/i18n/api";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local";
  const limited = rateLimit(`coupon:${ip}`, 60, 60_000);
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
    parsed = parseCouponBody(body);
  } catch {
    return NextResponse.json({ error: apiMessage("invalidPayload") }, { status: 400 });
  }

  const result = applyCoupon(parsed.code, parsed.subtotalCents);
  void nrRecordEvent(result.valid ? "CouponApplied" : "CouponRejected", {
    code: parsed.code.toUpperCase(),
    subtotal_cents: parsed.subtotalCents,
    discount_cents: result.valid ? result.discountCents : 0,
    free_shipping: result.valid ? result.freeShipping : false,
    reason: result.valid ? "" : result.message,
  });
  return NextResponse.json(result);
}
