import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { pool } from "@/db";
import type { User } from "@/types";

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (storedHash.startsWith("scrypt$")) {
      const [, saltHex, keyHex] = storedHash.split("$");
      if (!saltHex || !keyHex) return false;
      const expected = Buffer.from(keyHex, "hex");
      const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    }

    // Backward compatibility for legacy, unsalted SHA-256 hashes.
    const legacy = Buffer.from(createHash("sha256").update(password).digest("hex"), "utf8");
    const expected = Buffer.from(storedHash, "utf8");
    return legacy.length === expected.length && timingSafeEqual(legacy, expected);
  } catch {
    return false;
  }
}

export async function verifyAndUpgradePassword(
  userId: string,
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!verifyPassword(password, storedHash)) return false;

  if (!storedHash.startsWith("scrypt$")) {
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND password_hash = $3",
      [hashPassword(password), userId, storedHash]
    );
  }
  return true;
}

export async function findUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const res = await pool.query(
    "SELECT id, name, email, role, password_hash, created_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "user",
    password_hash: row.password_hash,
    createdAt: row.created_at,
  };
}

export async function findUserById(id: string): Promise<User | null> {
  const res = await pool.query(
    "SELECT id, name, email, role, created_at FROM users WHERE id = $1 LIMIT 1",
    [id]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "user",
    createdAt: row.created_at,
  };
}

export async function createUser(
  name: string,
  email: string,
  passwordPlain: string,
  role: "superadmin" | "admin" | "user" = "user"
): Promise<User> {
  const id = randomUUID();
  const passwordHash = hashPassword(passwordPlain);

  const res = await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role)
     VALUES ($1, $2, LOWER($3), $4, $5)
     RETURNING id, name, email, role, created_at`,
    [id, name, email, passwordHash, role]
  );

  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "user",
    createdAt: row.created_at,
  };
}

export async function findOrCreateOAuthUser(name: string, email: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: existing.role || "user",
      createdAt: existing.createdAt,
    };
  }

  // Generate secure random placeholder password hash for OAuth user
  const randomPass = randomUUID() + "-" + Date.now();
  return createUser(name || email.split("@")[0], normalizedEmail, randomPass);
}

export async function updateUserProfile(id: string, name: string): Promise<User | null> {
  const res = await pool.query(
    `UPDATE users
     SET name = $1
     WHERE id = $2
     RETURNING id, name, email, role, created_at`,
    [name, id]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "user",
    createdAt: row.created_at,
  };
}

export async function updateUserPassword(id: string, newPasswordPlain: string): Promise<boolean> {
  const passwordHash = hashPassword(newPasswordPlain);
  const res = await pool.query(
    `UPDATE users
     SET password_hash = $1
     WHERE id = $2`,
    [passwordHash, id]
  );
  return (res.rowCount ?? 0) > 0;
}
