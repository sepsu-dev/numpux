import { randomUUID } from "crypto";
import { pool } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { User } from "@/types";

export { hashPassword, verifyPassword } from "@/lib/password";

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

export async function markUserLogin(userId: string): Promise<void> {
  await pool.query(
    "UPDATE users SET last_login_at = NOW(), last_seen_at = NOW() WHERE id = $1",
    [userId]
  );
}

export async function markUserSeen(userId: string): Promise<void> {
  await pool.query(
    "UPDATE users SET last_seen_at = NOW(), last_login_at = COALESCE(last_login_at, NOW()) WHERE id = $1",
    [userId]
  );
}

export async function markUserOffline(userId: string): Promise<void> {
  await pool.query("UPDATE users SET last_seen_at = NULL WHERE id = $1", [userId]);
}

export async function getUserSessionVersion(userId: string): Promise<number> {
  const result = await pool.query("SELECT session_version FROM users WHERE id = $1", [userId]);
  return Number(result.rows[0]?.session_version || 1);
}

export async function findUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const res = await pool.query(
    "SELECT id, name, email, role, password_hash, account_status, last_login_at, created_at FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL LIMIT 1",
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
    accountStatus: row.account_status || "active",
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
  role: "superadmin" | "admin" | "user" = "user",
  accountOrigin: "system" | "self_registered" | "invited" = "invited",
  invitedBy: string | null = null
): Promise<User> {
  const id = randomUUID();
  const passwordHash = hashPassword(passwordPlain);

  const res = await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, account_origin, invited_by)
     VALUES ($1, $2, LOWER($3), $4, $5, $6, $7)
     RETURNING id, name, email, role, created_at`,
    [id, name, email, passwordHash, role, accountOrigin, invitedBy]
  );

  const row = res.rows[0];
  if (accountOrigin === "self_registered") {
    const { createPersonalWorkspace } = await import("@/lib/workspace");
    await createPersonalWorkspace(row.id, row.name);
  }
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
  return createUser(name || email.split("@")[0], normalizedEmail, randomPass, "user", "self_registered");
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
