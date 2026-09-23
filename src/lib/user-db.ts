import { createHash } from "crypto";
import { pool } from "./db";
import type { User } from "./types";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function findUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const res = await pool.query(
    "SELECT id, name, email, password_hash, created_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password_hash: row.password_hash,
    createdAt: row.created_at,
  };
}

export async function findUserById(id: string): Promise<User | null> {
  const res = await pool.query(
    "SELECT id, name, email, created_at FROM users WHERE id = $1 LIMIT 1",
    [id]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

export async function createUser(name: string, email: string, passwordPlain: string): Promise<User> {
  const id = crypto.randomUUID();
  const passwordHash = hashPassword(passwordPlain);

  const res = await pool.query(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES ($1, $2, LOWER($3), $4)
     RETURNING id, name, email, created_at`,
    [id, name, email, passwordHash]
  );

  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
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
      createdAt: existing.createdAt,
    };
  }

  // Generate secure random placeholder password hash for OAuth user
  const randomPass = crypto.randomUUID() + "-" + Date.now();
  return createUser(name || email.split("@")[0], normalizedEmail, randomPass);
}

export async function updateUserProfile(id: string, name: string): Promise<User | null> {
  const res = await pool.query(
    `UPDATE users
     SET name = $1
     WHERE id = $2
     RETURNING id, name, email, created_at`,
    [name, id]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
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
