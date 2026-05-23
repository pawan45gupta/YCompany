import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/observability/env";

type ErrorContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

/** Report an error to Sentry when configured; always logs in development. */
export function reportError(error: unknown, context?: ErrorContext): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[YCompany]", error, context?.extra ?? "");
  }

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
