import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/signup/route";
import * as emailNotifications from "@/lib/email/notifications";
import { __resetUsersForTests, findUserByEmail } from "@/lib/users/store";
import * as userStore from "@/lib/users/store";
import { makeStoredUser } from "@/test/fixtures/user";
import { toPublicUser } from "@/types/user";

function postJson(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    __resetUsersForTests();
    // Each test gets a unique IP so the in-process rate limiter doesn't bleed
    // between cases.
  });
  afterEach(() => __resetUsersForTests());

  it("creates a user and returns 201 with the public profile", async () => {
    const res = await POST(
      postJson(
        { email: "new@x.com", password: "Strong123", name: "New User" },
        { "x-forwarded-for": "10.0.0.1" },
      ),
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { user: { email: string; id: string } };
    expect(json.user.email).toBe("new@x.com");
    expect(json.user).not.toHaveProperty("passwordHash");
    expect(findUserByEmail("new@x.com")).not.toBeNull();
  });

  it("rejects invalid JSON with 400", async () => {
    const req = new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.2" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("surfaces a Zod password message on 400", async () => {
    const res = await POST(
      postJson(
        { email: "weak@x.com", password: "short" },
        { "x-forwarded-for": "10.0.0.3" },
      ),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error.toLowerCase()).toContain("password");
  });

  it("returns 409 when the email is already registered", async () => {
    await POST(
      postJson(
        { email: "dup@x.com", password: "Strong123" },
        { "x-forwarded-for": "10.0.0.4" },
      ),
    );
    const second = await POST(
      postJson(
        { email: "dup@x.com", password: "Strong123" },
        { "x-forwarded-for": "10.0.0.4" },
      ),
    );
    expect(second.status).toBe(409);
  });

  it("returns 429 once the per-IP burst is exhausted", async () => {
    vi.spyOn(userStore, "createUser").mockImplementation(async (input) => ({
      ok: true,
      user: toPublicUser(
        makeStoredUser({
          id: `user-${input.email}`,
          email: input.email,
          name: input.name ?? null,
        }),
      ),
    }));
    vi.spyOn(emailNotifications, "sendWelcomeEmail").mockResolvedValue(undefined);

    // The limit is 10/minute. Use a distinct IP so we don't poison other tests.
    const ip = "10.0.0.99";
    for (let i = 0; i < 10; i++) {
      const r = await POST(
        postJson(
          { email: `burst${i}@x.com`, password: "Strong123" },
          { "x-forwarded-for": ip },
        ),
      );
      expect(r.status).toBe(201);
    }
    const blocked = await POST(
      postJson(
        { email: "burst10@x.com", password: "Strong123" },
        { "x-forwarded-for": ip },
      ),
    );
    expect(blocked.status).toBe(429);
  });
});

// Silence console.info noise from the rare path that writes to disk in test
// runs where the data dir already exists.
vi.spyOn(console, "error").mockImplementation(() => {});
