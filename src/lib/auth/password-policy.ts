/**
 * Shared client + server password policy. The server contract lives in
 * `src/lib/env.ts` (`passwordSchema`); this module is the *client mirror*
 * so the Signup / Reset views can give live feedback without a round-trip
 * and without bundling Zod just to render a checklist.
 *
 * Display labels live in `en.json` (`passwordPolicy.*`) via PasswordChecklist.
 */

export type PasswordCheckId = "length" | "letter" | "digit";

export type PasswordCheck = {
  id: PasswordCheckId;
  passed: boolean;
};

export type PasswordEvaluation = {
  checks: PasswordCheck[];
  strong: boolean;
};

export function evaluatePassword(password: string): PasswordEvaluation {
  const checks: PasswordCheck[] = [
    { id: "length", passed: password.length >= 8 },
    { id: "letter", passed: /[A-Za-z]/.test(password) },
    { id: "digit", passed: /\d/.test(password) },
  ];
  return { checks, strong: checks.every((c) => c.passed) };
}
