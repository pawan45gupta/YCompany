const AUTH_ERROR_KEYS: Record<string, string> = {
  Configuration: "login.authErrors.configuration",
  OAuthCallbackError: "login.authErrors.oauthCallback",
  OAuthSignin: "login.authErrors.oauthSignin",
  AccessDenied: "login.authErrors.accessDenied",
  Verification: "login.authErrors.verification",
  MissingCSRF: "login.authErrors.missingCsrf",
};

export function getAuthErrorMessageKey(code: string | null): string {
  if (!code) return "login.oauthError";
  return AUTH_ERROR_KEYS[code] ?? "login.oauthError";
}
