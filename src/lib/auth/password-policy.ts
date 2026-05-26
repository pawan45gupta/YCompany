/**
 * Shared client + server password policy. The server contract lives in
 * `src/lib/env.ts` (`passwordSchema`); this module is the *client mirror*
 * so the Signup / Reset views can give live feedback without a round-trip
 * and without bundling Zod just to render a checklist.
 */

export type PasswordCheck = {
  id: "length" | "letter" | "digit";
  label: string;
  passed: boolean;
};

export type PasswordEvaluation = {
  checks: PasswordCheck[];
  strong: boolean;
};

export function evaluatePassword(password: string): PasswordEvaluation {
  const checks: PasswordCheck[] = [
    {
      id: "length",
      label: "At least 8 characters",
      passed: password.length >= 8,
    },
    {
      id: "letter",
      label: "Contains a letter",
      passed: /[A-Za-z]/.test(password),
    },
    { id: "digit", label: "Contains a number", passed: /\d/.test(password) },
  ];
  return { checks, strong: checks.every((c) => c.passed) };
}
