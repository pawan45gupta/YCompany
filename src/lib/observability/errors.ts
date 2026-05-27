import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/observability/env";
import { nrNoticeError } from "@/lib/observability/newrelic-server";

type ErrorContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

/**
 * Flatten an `extra` object into NR-compatible scalar attributes. Anything
 * non-primitive becomes a JSON string so it still shows up on the event
 * (NR rejects objects/arrays in `customAttributes`).
 */
function toNrAttributes(
  context: ErrorContext | undefined,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(context?.tags ?? {})) {
    out[k] = v;
  }
  for (const [k, v] of Object.entries(context?.extra ?? {})) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else if (v !== null && v !== undefined) {
      try {
        out[k] = JSON.stringify(v);
      } catch {
        /* unstringifiable — skip */
      }
    }
  }
  return out;
}

/**
 * Report a handled error to every configured backend (Sentry + New Relic)
 * and always log in development.
 *
 * Each backend is independently gated:
 *   - Sentry is called only when `NEXT_PUBLIC_SENTRY_DSN` is set.
 *   - NR is called via the `nrNoticeError` wrapper, which itself no-ops
 *     when the agent isn't loaded.
 *
 * The function returns synchronously even though NR's path is async; we
 * intentionally fire-and-forget the NR call to keep error paths cheap.
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[YCompany]", error, context?.extra ?? "");
  }

  // New Relic side — async-safe, never throws, returns before agent ack.
  void nrNoticeError(error, toNrAttributes(context));

  if (!isSentryEnabled()) return;

  Sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    if (context?.extra) {
      scope.setExtras(context.extra);
    }
    Sentry.captureException(error);
  });
}
