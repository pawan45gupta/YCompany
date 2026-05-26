import bcrypt from "bcryptjs";
import type { StoredUser } from "@/types/user";

/** Synchronous helper so test setup doesn't need top-level await. */
export function makeStoredUser(overrides: Partial<StoredUser> = {}): StoredUser {
  return {
    id: "user-test-1",
    email: "test@ycompany.com",
    name: "Test User",
    // Pre-computed cost-4 hash of "TestPass1" — bcryptjs cost 4 is fast
    // enough to keep the full suite under 2s while still exercising the
    // verify path. Created via:
    //   bcrypt.hashSync("TestPass1", 4)
    passwordHash: bcrypt.hashSync("TestPass1", 4),
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export const TEST_PASSWORD = "TestPass1";
