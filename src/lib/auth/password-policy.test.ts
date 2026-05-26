import { describe, expect, it } from "vitest";
import { evaluatePassword } from "@/lib/auth/password-policy";

describe("evaluatePassword", () => {
  it("returns all-failed checks for an empty password", () => {
    const { checks, strong } = evaluatePassword("");
    expect(strong).toBe(false);
    expect(checks.map((c) => c.passed)).toEqual([false, false, false]);
  });

  it("passes only the digit and length checks for an all-numeric long string", () => {
    const { checks, strong } = evaluatePassword("12345678");
    const byId = Object.fromEntries(checks.map((c) => [c.id, c.passed]));
    expect(byId).toEqual({ length: true, letter: false, digit: true });
    expect(strong).toBe(false);
  });

  it("marks strong=true only when every check passes", () => {
    expect(evaluatePassword("Abcdefg1").strong).toBe(true);
    expect(evaluatePassword("Abcdefgh").strong).toBe(false);
    expect(evaluatePassword("12345abc").strong).toBe(true);
    expect(evaluatePassword("Ab1").strong).toBe(false);
  });
});
