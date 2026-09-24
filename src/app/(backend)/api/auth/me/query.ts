import { pool } from "@/db";
import { hashPassword } from "@/lib/user-db";
import type { User } from "@/types";

export async function findUserWithPassword(email: string): Promise<(User & { password_hash: string }) | null> {
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

export async function updateUserProfileQuery(userId: string, name: string): Promise<User | null> {
  const res = await pool.query(
    `UPDATE users
     SET name = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, email, created_at`,
    [name, userId]
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

export async function updateUserPasswordQuery(userId: string, newPasswordPlain: string): Promise<boolean> {
  const passwordHash = hashPassword(newPasswordPlain);
  const res = await pool.query(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, userId]
  );
  return (res.rowCount ?? 0) > 0;
}
