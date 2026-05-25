import { vi } from "vitest";

export const mockSignIn = vi.fn();
export const mockSignOut = vi.fn();
export const mockUseSession = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));
