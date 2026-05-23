/** Default landing page after sign-in (Shop catalog). */
export const DEFAULT_SIGNED_IN_URL = "/products";

/** Safe internal path for post-login redirects. */
export function getSafeCallbackUrl(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return DEFAULT_SIGNED_IN_URL;
  }
  return raw;
}
