/** Sentry DSN (client + server). */
export function getSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
}

export function isSentryEnabled(): boolean {
  return Boolean(getSentryDsn());
}

/** Google Analytics 4 measurement ID (G-XXXXXXXX). */
export function getGaMeasurementId(): string | undefined {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || undefined;
}

export function isGoogleAnalyticsEnabled(): boolean {
  return Boolean(getGaMeasurementId());
}

export function isNewRelicEnabled(): boolean {
  return Boolean(process.env.NEW_RELIC_LICENSE_KEY?.trim());
}
