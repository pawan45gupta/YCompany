import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { PublicUser, StoredUser } from "@/types/user";
import { toPublicUser } from "@/types/user";

// 12 = ~250ms per hash on a modern laptop (OWASP "Password Storage Cheat Sheet"
// floor for 2024+). bcryptjs is pure-JS so it's noticeably slower than the
// native bcrypt addon — 10 would feel snappier but 12 keeps brute-force costs
// in line with current guidance.
export const BCRYPT_COST = 12;

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");

type UsersFile = { users: StoredUser[] };

declare global {
  // Hot-reload safe single source of truth in dev. In prod the singleton is
  // still useful because the module is evaluated once per worker and we
  // don't want every read to touch disk.
  var __ycompanyUsers: StoredUser[] | undefined;
}

function readFileUsers(): StoredUser[] | null {
  try {
    if (!existsSync(USERS_PATH)) return null;
    const raw = readFileSync(USERS_PATH, "utf8");
    const parsed = JSON.parse(raw) as UsersFile;
    return Array.isArray(parsed.users) ? parsed.users : [];
  } catch {
    return null;
  }
}

function writeFileUsers(users: StoredUser[]): boolean {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(USERS_PATH, JSON.stringify({ users }, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

function loadUsers(): StoredUser[] {
  if (globalThis.__ycompanyUsers) return globalThis.__ycompanyUsers;
  globalThis.__ycompanyUsers = readFileUsers() ?? [];
  return globalThis.__ycompanyUsers;
}

function saveUsers(users: StoredUser[]): void {
  globalThis.__ycompanyUsers = users;
  writeFileUsers(users);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findUserByEmail(email: string): StoredUser | null {
  const wanted = normalizeEmail(email);
  return loadUsers().find((u) => u.email === wanted) ?? null;
}

export function findUserById(id: string): StoredUser | null {
  return loadUsers().find((u) => u.id === id) ?? null;
}

export type CreateUserInput = {
  email: string;
  password: string;
  name?: string | null;
};

export type CreateUserResult =
  | { ok: true; user: PublicUser }
  | { ok: false; reason: "email_taken" };

export async function createUser(
  input: CreateUserInput,
): Promise<CreateUserResult> {
  const email = normalizeEmail(input.email);
  const users = loadUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, reason: "email_taken" };
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user: StoredUser = {
    id: randomUUID(),
    email,
    name: input.name?.trim() || null,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, user]);
  return { ok: true, user: toPublicUser(user) };
}

/**
 * Verify an email/password pair. Returns a PublicUser on success, null on
 * any failure (unknown email, wrong password, malformed hash). Callers must
 * NOT differentiate "unknown email" from "wrong password" externally — that
 * leaks account-existence information.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = findUserByEmail(email);
  if (!user) return null;
  try {
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
  } catch {
    return null;
  }
  return toPublicUser(user);
}

export async function updatePassword(
  userId: string,
  newPassword: string,
): Promise<boolean> {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return false;
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  const next = [...users];
  next[idx] = { ...next[idx], passwordHash };
  saveUsers(next);
  return true;
}

// ---- Test-only helper ------------------------------------------------------
// Vitest needs a way to reset the in-memory + on-disk store between cases.
// Production code never imports this; tree-shaking keeps it dead-code in any
// build that doesn't pull it in.
export function __resetUsersForTests(seed: StoredUser[] = []): void {
  globalThis.__ycompanyUsers = [...seed];
  // Best-effort wipe of the file too, so the next process boot is clean.
  if (existsSync(USERS_PATH)) writeFileUsers(seed);
}
