import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/forgot-password/route";
import { __resetPasswordTokensForTests } from "@/lib/auth/password-reset";
import { __resetUsersForTests, createUser } from "@/lib/users/store";

function postJson(body: unknown, ip = "10.1.0.1") {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    __resetUsersForTests();
    __resetPasswordTokensForTests();
  });
  afterEach(() => {
    __resetUsersForTests();
    __resetPasswordTokensForTests();
  });

  it("returns 200 ok for an unknown email (anti-enumeration)", async () => {
    const res = await POST(postJson({ email: "nobody@x.com" }, "10.1.0.2"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("issues a token + logs the reset URL when the email exists", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await createUser({ email: "real@x.com", password: "Strong123" });
    const res = await POST(postJson({ email: "real@x.com" }, "10.1.0.3"));
    expect(res.status).toBe(200);
    expect(info).toHaveBeenCalled();
    const logged = info.mock.calls[0]?.[0] as string;
    expect(logged).toContain("[auth] password reset");
    expect(logged).toContain("real@x.com");
    expect(logged).toContain("/reset-password/");
    info.mockRestore();
  });

  it("returns the same JSON shape for known and unknown emails", async () => {
    await createUser({ email: "exists@x.com", password: "Strong123" });
    const a = await POST(postJson({ email: "exists@x.com" }, "10.1.0.4"));
    const b = await POST(postJson({ email: "ghost@x.com" }, "10.1.0.5"));
    expect(await a.json()).toEqual({ ok: true });
    expect(await b.json()).toEqual({ ok: true });
  });

  it("rejects malformed email payloads with 400", async () => {
    const res = await POST(postJson({ email: "not-an-email" }, "10.1.0.6"));
    expect(res.status).toBe(400);
  });

  it("enforces a per-IP rate limit (5/min)", async () => {
    const ip = "10.1.0.7";
    for (let i = 0; i < 5; i++) {
      const r = await POST(postJson({ email: `x${i}@x.com` }, ip));
      expect(r.status).toBe(200);
    }
    const blocked = await POST(postJson({ email: "x5@x.com" }, ip));
    expect(blocked.status).toBe(429);
  });
});
