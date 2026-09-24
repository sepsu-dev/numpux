import { pool } from "@/db";
import { hashPassword } from "@/lib/user-db";
import type { User } from "@/types";

export async function findUsers(search?: string, limit = 20, offset = 0): Promise<{ users: User[]; total: number }> {
  let query = "SELECT id, name, email, role, created_at FROM users";
  let countQuery = "SELECT COUNT(*) FROM users";
  const params: any[] = [];

  if (search) {
    query += " WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1";
    countQuery += " WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1";
    params.push(`%${search.toLowerCase()}%`);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const queryParams = [...params, limit, offset];

  const [res, countRes] = await Promise.all([
    pool.query(query, queryParams),
    pool.query(countQuery, params),
  ]);

  const users: User[] = res.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "user",
    createdAt: row.created_at,
  }));

  const total = parseInt(countRes.rows[0]?.count || "0", 10);
  return { users, total };
}

export async function insertUser(
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
