import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/reset-password/route";
import {
  __resetPasswordTokensForTests,
  issueResetToken,
} from "@/lib/auth/password-reset";
import {
  __resetUsersForTests,
  createUser,
  verifyCredentials,
} from "@/lib/users/store";

function postJson(body: unknown, ip = "10.2.0.1") {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    __resetUsersForTests();
    __resetPasswordTokensForTests();
  });
  afterEach(() => {
    __resetUsersForTests();
    __resetPasswordTokensForTests();
  });

  it("rejects an unknown token with 400", async () => {
    const res = await POST(
      postJson({ token: "a".repeat(43), password: "Strong123" }, "10.2.0.2"),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a password that fails the policy with 400", async () => {
    const create = await createUser({
      email: "p@x.com",
      password: "Strong123",
    });
    if (!create.ok) throw new Error("setup failed");
    const { token } = issueResetToken(create.user.id);
    const res = await POST(postJson({ token, password: "weak" }, "10.2.0.3"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error.toLowerCase()).toContain("password");
  });

  it("updates the password and consumes the token (single-use)", async () => {
    const create = await createUser({
      email: "u@x.com",
      password: "Strong123",
    });
    if (!create.ok) throw new Error("setup failed");
    const { token } = issueResetToken(create.user.id);

    const first = await POST(
      postJson({ token, password: "Replaced123" }, "10.2.0.4"),
    );
    expect(first.status).toBe(200);

    // Old password no longer works, new one does.
    expect(await verifyCredentials("u@x.com", "Strong123")).toBeNull();
    expect(await verifyCredentials("u@x.com", "Replaced123")).not.toBeNull();

    // Token cannot be reused.
    const second = await POST(
      postJson({ token, password: "Another123" }, "10.2.0.4"),
    );
    expect(second.status).toBe(400);
  });

  it("rejects malformed JSON with 400", async () => {
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.2.0.5" },
      body: "{not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("enforces a per-IP rate limit (10/min)", async () => {
    const ip = "10.2.0.6";
    for (let i = 0; i < 10; i++) {
      const r = await POST(
        postJson({ token: "x".repeat(43), password: "Strong123" }, ip),
      );
      // Each one fails with 400 (unknown token) but still consumes a slot.
      expect(r.status).toBe(400);
    }
    const blocked = await POST(
      postJson({ token: "x".repeat(43), password: "Strong123" }, ip),
    );
    expect(blocked.status).toBe(429);
  });
});
