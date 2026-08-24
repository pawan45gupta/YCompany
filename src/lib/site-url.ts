const LOCALHOST = /^(localhost|127\.0\.0\.1|\[::1\])$/i;

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalhostUrl(url: string): boolean {
  try {
    return LOCALHOST.test(new URL(url).hostname);
  } catch {
    return true;
  }
}

function originFromRequest(req: Request): string | undefined {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host");
  if (!host) return undefined;

  const hostname = host.split(",")[0]?.trim() ?? host;
  const proto =
    forwardedProto?.split(",")[0]?.trim() ??
    (LOCALHOST.test(hostname.split(":")[0] ?? hostname) ? "http" : "https");

  return `${proto}://${hostname}`;
}

function vercelSiteUrl(): string | undefined {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (!host) return undefined;
  if (host.startsWith("http://") || host.startsWith("https://")) {
    return normalizeUrl(host);
  }
  return `https://${host}`;
}

function configuredEnvValues(): (string | undefined)[] {
  return [
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];
}

function firstMatchingEnvUrl(
  predicate: (value: string) => boolean,
): string | undefined {
  for (const value of configuredEnvValues()) {
    if (value && predicate(value)) {
      return normalizeUrl(value);
    }
  }
  return undefined;
}

function resolveFromRequest(
  request: Request,
  allowLocalhost: boolean,
): string | undefined {
  const fromRequest = originFromRequest(request);
  if (!fromRequest) return undefined;
  if (!allowLocalhost && isLocalhostUrl(fromRequest)) return undefined;
  return normalizeUrl(fromRequest);
}

function nonLocalhostVercelUrl(): string | undefined {
  const vercel = vercelSiteUrl();
  if (vercel && !isLocalhostUrl(vercel)) return vercel;
  return undefined;
}

type SiteUrlResolver = (request?: Request) => string | undefined;

const SITE_URL_RESOLVERS: SiteUrlResolver[] = [
  () => firstMatchingEnvUrl((value) => !isLocalhostUrl(value)),
  (request) =>
    request ? resolveFromRequest(request, false) : undefined,
  () => nonLocalhostVercelUrl(),
  (request) => (request ? resolveFromRequest(request, true) : undefined),
  () => firstMatchingEnvUrl(() => true),
];

/**
 * Canonical public base URL for auth redirects, Stripe return URLs, emails, etc.
 * Prefers explicit env vars, then the incoming request, then Vercel-provided hostnames.
 */
export function resolveSiteUrl(request?: Request): string {
  for (const resolve of SITE_URL_RESOLVERS) {
    const url = resolve(request);
    if (url) return url;
  }
  return "http://localhost:3000";
}

/** Override localhost AUTH_URL/NEXTAUTH_URL on Vercel when env still points at dev. */
export function bootstrapAuthSiteUrl(): void {
  if (process.env.NODE_ENV !== "production") return;

  const resolved = resolveSiteUrl();
  if (isLocalhostUrl(resolved)) return;

  if (!process.env.AUTH_URL || isLocalhostUrl(process.env.AUTH_URL)) {
    process.env.AUTH_URL = resolved;
  }
  if (!process.env.NEXTAUTH_URL || isLocalhostUrl(process.env.NEXTAUTH_URL)) {
    process.env.NEXTAUTH_URL = resolved;
  }
}
