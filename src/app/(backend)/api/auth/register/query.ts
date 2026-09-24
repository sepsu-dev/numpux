import { pool } from "@/db";
import { hashPassword } from "@/lib/user-db";
import type { User } from "@/types";

export async function findUserByEmailQuery(email: string): Promise<User | null> {
  const res = await pool.query(
    "SELECT id, name, email, role, created_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email]
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

export async function createNewUser(
  name: string,
  email: string,
  passwordPlain: string,
  role: "admin" | "user" = "user"
): Promise<User> {
  const id = crypto.randomUUID();
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
