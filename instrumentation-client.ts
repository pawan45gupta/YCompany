import * as Sentry from "@sentry/nextjs";
import { initSentryClient } from "@/lib/observability/sentry-client";

initSentryClient();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
