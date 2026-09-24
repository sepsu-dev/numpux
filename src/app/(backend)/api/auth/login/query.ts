import { pool } from "@/db";
import type { User } from "@/types";

export async function findUserForLogin(email: string): Promise<(User & { password_hash: string }) | null> {
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
