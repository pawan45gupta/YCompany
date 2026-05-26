import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetPasswordTokensForTests,
  buildResetUrl,
  consumeResetToken,
  issueResetToken,
  verifyResetToken,
} from "@/lib/auth/password-reset";

describe("password-reset tokens", () => {
  beforeEach(() => __resetPasswordTokensForTests());
  afterEach(() => __resetPasswordTokensForTests());

  it("issues a random-looking base64url token", () => {
    const a = issueResetToken("user-1");
    const b = issueResetToken("user-2");
    expect(a.token).not.toBe(b.token);
    // base64url alphabet only (no `+`, `/`, or `=`).
    expect(a.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.token.length).toBeGreaterThanOrEqual(40);
  });

  it("verifyResetToken accepts a fresh token and returns the user id", () => {
    const { token } = issueResetToken("user-42");
    expect(verifyResetToken(token)).toBe("user-42");
  });

  it("rejects an unknown / malformed token", () => {
    expect(verifyResetToken("short")).toBeNull();
    expect(verifyResetToken("a".repeat(60))).toBeNull();
  });

  it("rejects an expired token", () => {
    const { token } = issueResetToken("user-1", { ttlMs: -1 });
    expect(verifyResetToken(token)).toBeNull();
  });

  it("issuing a second token for the same user invalidates the first", () => {
    const first = issueResetToken("user-1");
    const second = issueResetToken("user-1");
    expect(verifyResetToken(first.token)).toBeNull();
    expect(verifyResetToken(second.token)).toBe("user-1");
  });

  it("consumeResetToken returns the user id once, then never again", () => {
    const { token } = issueResetToken("user-99");
    expect(consumeResetToken(token)).toBe("user-99");
    // Single-use semantics: a second consume (or verify) fails.
    expect(consumeResetToken(token)).toBeNull();
    expect(verifyResetToken(token)).toBeNull();
  });

  it("buildResetUrl produces an absolute /reset-password/<token> URL", () => {
    const url = buildResetUrl("abc.def-ghi_xyz", "https://shop.example.com");
    expect(url).toBe("https://shop.example.com/reset-password/abc.def-ghi_xyz");
  });
});
