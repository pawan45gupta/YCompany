import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetUsersForTests,
  createUser,
  findUserByEmail,
  findUserById,
  updatePassword,
  verifyCredentials,
} from "@/lib/users/store";
import { makeStoredUser, TEST_PASSWORD } from "@/test/fixtures/user";

describe("users/store", () => {
  beforeEach(() => __resetUsersForTests());
  afterEach(() => __resetUsersForTests());

  describe("createUser", () => {
    it("creates a new user with a hashed password and uuid id", async () => {
      const res = await createUser({
        email: "Alice@Example.com",
        password: TEST_PASSWORD,
        name: "Alice",
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      // Email is normalised to lowercase.
      expect(res.user.email).toBe("alice@example.com");
      expect(res.user.name).toBe("Alice");
      // UUID v4 shape.
      expect(res.user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      // PublicUser never carries the hash.
      expect(res.user).not.toHaveProperty("passwordHash");
    });

    it("trims and stores name, or stores null when blank", async () => {
      const a = await createUser({
        email: "a@x.com",
        password: TEST_PASSWORD,
        name: "  Bob  ",
      });
      const b = await createUser({
        email: "b@x.com",
        password: TEST_PASSWORD,
        name: "   ",
      });
      expect(a.ok && a.user.name).toBe("Bob");
      expect(b.ok && b.user.name).toBe(null);
    });

    it("rejects a duplicate email regardless of case", async () => {
      const first = await createUser({
        email: "dup@x.com",
        password: TEST_PASSWORD,
      });
      const second = await createUser({
        email: "DUP@x.com",
        password: TEST_PASSWORD,
      });
      expect(first.ok).toBe(true);
      expect(second.ok).toBe(false);
      if (!second.ok) expect(second.reason).toBe("email_taken");
    });
  });

  describe("findUserByEmail / findUserById", () => {
    it("returns null when no such user", () => {
      expect(findUserByEmail("missing@x.com")).toBeNull();
      expect(findUserById("nope")).toBeNull();
    });

    it("locates a seeded user case-insensitively", () => {
      const u = makeStoredUser({ email: "seed@x.com" });
      __resetUsersForTests([u]);
      expect(findUserByEmail("SEED@x.com")?.id).toBe(u.id);
      expect(findUserById(u.id)?.email).toBe("seed@x.com");
    });
  });

  describe("verifyCredentials", () => {
    it("returns the public user when the password is correct", async () => {
      __resetUsersForTests([makeStoredUser({ email: "v@x.com" })]);
      const got = await verifyCredentials("v@x.com", TEST_PASSWORD);
      expect(got?.email).toBe("v@x.com");
      // hash never leaks
      expect(got).not.toHaveProperty("passwordHash");
    });

    it("returns null for a wrong password (no information leak)", async () => {
      __resetUsersForTests([makeStoredUser({ email: "v@x.com" })]);
      const got = await verifyCredentials("v@x.com", "wrong-password");
      expect(got).toBeNull();
    });

    it("returns null for an unknown email (same shape as wrong password)", async () => {
      const got = await verifyCredentials("missing@x.com", TEST_PASSWORD);
      expect(got).toBeNull();
    });

    it("returns null when the stored hash is malformed", async () => {
      __resetUsersForTests([
        makeStoredUser({ email: "bad@x.com", passwordHash: "not-a-hash" }),
      ]);
      const got = await verifyCredentials("bad@x.com", TEST_PASSWORD);
      expect(got).toBeNull();
    });
  });

  describe("updatePassword", () => {
    it("replaces the hash so old passwords stop working", async () => {
      const u = makeStoredUser({ email: "u@x.com" });
      __resetUsersForTests([u]);
      const ok = await updatePassword(u.id, "Replaced123");
      expect(ok).toBe(true);

      expect(await verifyCredentials("u@x.com", TEST_PASSWORD)).toBeNull();
      expect(await verifyCredentials("u@x.com", "Replaced123")).not.toBeNull();
    });

    it("returns false for an unknown user id", async () => {
      const ok = await updatePassword("missing", "Replaced123");
      expect(ok).toBe(false);
    });
  });
});
