import { pool } from "@/db";
import { hashPassword } from "@/lib/user-db";
import type { User } from "@/types";
import type { UpdateUserInput } from "./schema";

export async function findUsers(search?: string, limit = 20, offset = 0, roleScope?: string, invitedBy?: string): Promise<{ users: User[]; total: number }> {
  let query = "SELECT id, name, email, role, account_status, last_login_at, created_at FROM users WHERE deleted_at IS NULL";
  let countQuery = "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL";
  const params: any[] = [];

  if (roleScope) {
    params.push(roleScope);
    query += ` AND role = $${params.length}`;
    countQuery += ` AND role = $${params.length}`;
  }

  if (invitedBy) {
    params.push(invitedBy);
    query += ` AND invited_by = $${params.length}`;
    countQuery += ` AND invited_by = $${params.length}`;
  }

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
    countQuery += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
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
    accountStatus: row.account_status || "active",
    lastLoginAt: row.last_login_at,
  }));

  const total = parseInt(countRes.rows[0]?.count || "0", 10);
  return { users, total };
}

export async function findUserRoleById(id: string): Promise<string | null> {
  const result = await pool.query("SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL", [id]);
  return result.rows[0]?.role || null;
}

export async function findUserAccessById(id: string): Promise<{ role: string; accountOrigin: string; invitedBy: string | null } | null> {
  const result = await pool.query(
    "SELECT role, account_origin, invited_by FROM users WHERE id = $1 AND deleted_at IS NULL",
    [id]
  );
  if (!result.rows.length) return null;
  return {
    role: result.rows[0].role || "user",
    accountOrigin: result.rows[0].account_origin || "system",
    invitedBy: result.rows[0].invited_by || null,
  };
}

export async function updateUserById(id: string, data: UpdateUserInput): Promise<User | null> {
  const fields: string[] = [];
  const params: unknown[] = [id];
  const add = (column: string, value: unknown) => { params.push(value); fields.push(`${column} = $${params.length}`); };
  if (data.name !== undefined) add("name", data.name.trim());
  if (data.email !== undefined) add("email", data.email.trim().toLowerCase());
  if (data.role !== undefined) add("role", data.role);
  if (data.accountStatus !== undefined) add("account_status", data.accountStatus);
  if (data.password !== undefined) add("password_hash", hashPassword(data.password));
  if (data.forceLogout || data.password !== undefined || data.role !== undefined || data.accountStatus === "suspended") fields.push("session_version = session_version + 1");
  if (!fields.length) return null;
  fields.push("updated_at = NOW()");
  const result = await pool.query(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $1 AND deleted_at IS NULL RETURNING id, name, email, role, account_status, last_login_at, created_at`,
    params
  );
  if (!result.rows.length) return null;
  const row = result.rows[0];
  return { id: row.id, name: row.name, email: row.email, role: row.role, accountStatus: row.account_status, lastLoginAt: row.last_login_at, createdAt: row.created_at };
}

export async function softDeleteUserById(id: string): Promise<boolean> {
  const result = await pool.query(
    "UPDATE users SET deleted_at = NOW(), account_status = 'suspended', last_seen_at = NULL, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function insertUser(
  name: string,
  email: string,
  passwordPlain: string,
  role: "superadmin" | "admin" | "user" = "user",
  invitedBy: string | null = null
): Promise<User> {
  const id = crypto.randomUUID();
  const passwordHash = hashPassword(passwordPlain);

  const res = await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, account_origin, invited_by)
     VALUES ($1, $2, LOWER($3), $4, $5, 'invited', $6)
     RETURNING id, name, email, role, created_at`,
    [id, name, email, passwordHash, role, invitedBy]
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
