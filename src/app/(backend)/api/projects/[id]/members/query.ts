import { pool } from "@/db";
import type { ProjectMember, ProjectMemberRole } from "@/types";

export async function findProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const res = await pool.query(
    `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.created_at, u.name, u.email
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1 AND pm.deleted_at IS NULL
     ORDER BY pm.created_at ASC`,
    [projectId]
  );
  return res.rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role as ProjectMemberRole,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  }));
}

export async function insertProjectMember(
  projectId: string,
  userId: string,
  role: ProjectMemberRole = "contributor"
): Promise<ProjectMember> {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO project_members (id, project_id, user_id, role)
     VALUES ($1, $2, $3, LOWER($4))
     ON CONFLICT (project_id, user_id) 
     DO UPDATE SET role = EXCLUDED.role, deleted_at = NULL, updated_at = NOW();`,
    [id, projectId, userId, role]
  );

  const res = await pool.query(
    `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.created_at, u.name, u.email
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1 AND pm.user_id = $2 AND pm.deleted_at IS NULL LIMIT 1`,
    [projectId, userId]
  );
  const row = res.rows[0];
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role as ProjectMemberRole,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

export async function deleteProjectMember(projectId: string, memberId: string): Promise<boolean> {
  // Prevent deleting Owner
  const check = await pool.query(
    `SELECT role FROM project_members WHERE id = $1 AND project_id = $2`,
    [memberId, projectId]
  );
  if (check.rows.length === 0 || String(check.rows[0].role).toLowerCase() === "owner") {
    return false;
  }

  const res = await pool.query(
    `UPDATE project_members SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [memberId, projectId]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function updateProjectMemberRole(projectId: string, memberId: string, role: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE project_members SET role = LOWER($3), updated_at = NOW() WHERE id = $1 AND project_id = $2 AND LOWER(role) <> 'owner' AND deleted_at IS NULL`,
    [memberId, projectId, role]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function projectGroupExists(role: string): Promise<boolean> {
  const result = await pool.query("SELECT 1 FROM project_groups WHERE LOWER(name) = LOWER($1) LIMIT 1", [role]);
  return result.rows.length > 0;
}

export async function transferProjectOwnership(projectId: string, memberId: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const target = await client.query("SELECT user_id FROM project_members WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL FOR UPDATE", [memberId, projectId]);
    if (!target.rows.length) { await client.query("ROLLBACK"); return false; }
    await client.query("UPDATE project_members SET role = 'admin' WHERE project_id = $1 AND LOWER(role) = 'owner'", [projectId]);
    await client.query("UPDATE project_members SET role = 'owner', updated_at = NOW() WHERE id = $1 AND project_id = $2", [memberId, projectId]);
    await client.query("UPDATE projects SET user_id = $2, updated_at = NOW() WHERE id = $1", [projectId, target.rows[0].user_id]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
