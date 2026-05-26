/** Stored user record. The `passwordHash` never leaves the server. */
export type StoredUser = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  createdAt: string;
};

/** Safe shape exposed to NextAuth `authorize` and route handlers. */
export type PublicUser = Omit<StoredUser, "passwordHash">;

export function toPublicUser(u: StoredUser): PublicUser {
  return { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt };
}
