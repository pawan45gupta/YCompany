import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Password-reset tokens.
 *
 * Design notes:
 *
 *   - The token sent to the user is a URL-safe random string (32 bytes →
 *     43 chars base64url). The store keeps only its SHA-256 hash so a
 *     leaked users.json / leaked memory dump can't be used to mint
 *     password resets.
 *
 *   - Single-use: consuming a token removes it from the store. A second
 *     attempt with the same token (e.g. via browser back) fails with
 *     `not_found`.
 *
 *   - Time-boxed: default TTL is 1 hour. The same hash compare guards
 *     both validity and expiry, so the user-visible error never
 *     differentiates "wrong token" from "expired token" beyond a
 *     generic "Invalid or expired link" message.
 *
 *   - No DB yet, so this lives in-memory like the orders cache. Tokens
 *     don't survive a server restart; that's fine for a 1-hour TTL and
 *     keeps the surface tiny until we adopt a real datastore.
 *
 *   - We never log the raw token. The signup/forgot-password flows log
 *     the *reset URL* on the server console (dev-only convenience) so
 *     developers can pick it up without an email provider.
 */

const DEFAULT_TTL_MS = 60 * 60 * 1000;

type ResetEntry = {
  userId: string;
  tokenHash: Buffer;
  expiresAt: number;
};

declare global {
  var __ycompanyPasswordResets: Map<string, ResetEntry> | undefined;
}

function store(): Map<string, ResetEntry> {
  if (!globalThis.__ycompanyPasswordResets) {
    globalThis.__ycompanyPasswordResets = new Map();
  }
  return globalThis.__ycompanyPasswordResets;
}

function hash(token: string): Buffer {
  return createHash("sha256").update(token).digest();
}

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export type IssueOptions = {
  /** Override TTL — useful in tests. */
  ttlMs?: number;
};

export type IssuedToken = {
  token: string;
  expiresAt: number;
};

/**
 * Mint a fresh reset token for a user. Any previously-issued tokens for
 * the same user are invalidated, so a forgot-password resubmit always
 * supersedes the prior link.
 */
export function issueResetToken(
  userId: string,
  opts: IssueOptions = {},
): IssuedToken {
  const token = base64url(randomBytes(32));
  const ttl = opts.ttlMs ?? DEFAULT_TTL_MS;
  const expiresAt = Date.now() + ttl;

  const s = store();
  for (const [k, v] of s) if (v.userId === userId) s.delete(k);
  s.set(token.slice(0, 8), {
    userId,
    tokenHash: hash(token),
    expiresAt,
  });
  // Sweep expired entries opportunistically so the map doesn't grow forever
  // in a long-running process.
  sweepExpired(s);
  return { token, expiresAt };
}

function sweepExpired(s: Map<string, ResetEntry>): void {
  const now = Date.now();
  for (const [k, v] of s) if (v.expiresAt <= now) s.delete(k);
}

/**
 * Constant-time check that the supplied token matches a live reset entry
 * for some user. Returns the user id on success.
 */
export function verifyResetToken(token: string): string | null {
  if (typeof token !== "string" || token.length < 8) return null;
  const entry = store().get(token.slice(0, 8));
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) return null;
  const candidate = hash(token);
  // timingSafeEqual throws on length mismatch — both are SHA-256 (32 bytes).
  if (!timingSafeEqual(candidate, entry.tokenHash)) return null;
  return entry.userId;
}

/**
 * Atomically verify + consume a token. Use this in the reset-password
 * route to guarantee single-use semantics.
 */
export function consumeResetToken(token: string): string | null {
  const userId = verifyResetToken(token);
  if (!userId) return null;
  store().delete(token.slice(0, 8));
  return userId;
}

/** Build the URL the user clicks. Always uses the canonical site origin. */
export function buildResetUrl(token: string, baseUrl: string): string {
  const u = new URL(`/reset-password/${encodeURIComponent(token)}`, baseUrl);
  return u.toString();
}

// ---- Test-only helper -----------------------------------------------------
export function __resetPasswordTokensForTests(): void {
  globalThis.__ycompanyPasswordResets = new Map();
}
