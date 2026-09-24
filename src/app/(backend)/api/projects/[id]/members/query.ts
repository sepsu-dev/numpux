import { pool } from "@/db";
import type { ProjectMember, ProjectMemberRole } from "@/types";

export async function findProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const res = await pool.query(
    `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.created_at, u.name, u.email
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
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
  role: ProjectMemberRole = "Member"
): Promise<ProjectMember> {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO project_members (id, project_id, user_id, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (project_id, user_id) 
     DO UPDATE SET role = EXCLUDED.role;`,
    [id, projectId, userId, role]
  );

  const res = await pool.query(
    `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.created_at, u.name, u.email
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1 AND pm.user_id = $2 LIMIT 1`,
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
  if (check.rows.length === 0 || check.rows[0].role === "Owner") {
    return false;
  }

  const res = await pool.query(
    `DELETE FROM project_members WHERE id = $1 AND project_id = $2`,
    [memberId, projectId]
  );
  return (res.rowCount ?? 0) > 0;
}
