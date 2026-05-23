import * as Sentry from "@sentry/nextjs";

const INIT_KEY = "__ycompany_sentry_client_init__";

/** Initializes Sentry on the browser once (avoids duplicate Session Replay). */
export function initSentryClient(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { [INIT_KEY]?: boolean };
  if (w[INIT_KEY]) return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.replayIntegration()],
    sendDefaultPii: false,
  });

  w[INIT_KEY] = true;
}
