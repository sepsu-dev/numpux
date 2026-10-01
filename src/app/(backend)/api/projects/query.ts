import { pool } from "@/db";
import type { Project } from "@/types";
import type { CreateProjectInput, UpdateProjectInput } from "./schema";

export async function findProjects(userId?: string): Promise<Project[]> {
  let query = `
    SELECT 
      p.id, 
      p.user_id, 
      p.workspace_id,
      p.title, 
      p.description, 
      p.category, 
      p.status, 
      COUNT(t.id)::int as tasks,
      p.progress,
      COUNT(DISTINCT pm.id)::int as members_count,
      MAX(CASE WHEN pm.user_id = $1 THEN pm.role ELSE NULL END) as current_user_role,
      MAX(CASE WHEN wm.user_id = $1 THEN wm.role ELSE NULL END) as current_workspace_role
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.deleted_at IS NULL
    LEFT JOIN workspace_members wm ON wm.workspace_id = p.workspace_id AND wm.status = 'active' AND wm.deleted_at IS NULL
  `;
  const params: any[] = [];

  query += ` WHERE p.deleted_at IS NULL`;

  if (userId) {
    query += `
      AND (
        p.user_id = $1 
        OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $1 AND deleted_at IS NULL)
        OR p.workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = $1 AND role IN ('owner', 'admin') AND status = 'active' AND deleted_at IS NULL)
      )
    `;
    params.push(userId);
  }

  query += ` GROUP BY p.id ORDER BY p.created_at DESC;`;

  const res = await pool.query(query, params);
  return res.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id || undefined,
    title: row.title,
    description: row.description || "",
    category: row.category || "",
    status: row.status || "",
    tasks: row.tasks || 0,
    progress: row.progress || 0,
    membersCount: row.members_count || 0,
    userRole: (userId && row.user_id === userId ? "owner" : row.current_user_role || (["owner", "admin"].includes(String(row.current_workspace_role).toLowerCase()) ? "admin" : undefined)) as any,
  }));
}

export async function findProjectById(id: string, userId?: string): Promise<Project | null> {
  let query = `
    SELECT 
      p.id, 
      p.user_id, 
      p.workspace_id,
      p.title, 
      p.description, 
      p.category, 
      p.status, 
      COUNT(t.id)::int as tasks,
      p.progress,
      COUNT(DISTINCT pm.id)::int as members_count,
      MAX(CASE WHEN pm.user_id = $2 THEN pm.role ELSE NULL END) as current_user_role,
      MAX(CASE WHEN wm.user_id = $2 THEN wm.role ELSE NULL END) as current_workspace_role
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.deleted_at IS NULL
    LEFT JOIN workspace_members wm ON wm.workspace_id = p.workspace_id AND wm.status = 'active' AND wm.deleted_at IS NULL
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `;
  const params: any[] = [id];

  if (userId) {
    query += `
      AND (
        p.user_id = $2 
        OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $2 AND deleted_at IS NULL)
        OR p.workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = $2 AND role IN ('owner', 'admin') AND status = 'active' AND deleted_at IS NULL)
      )
    `;
    params.push(userId);
  }

  query += ` GROUP BY p.id;`;

  const res = await pool.query(query, params);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id || undefined,
    title: row.title,
    description: row.description || "",
    category: row.category || "",
    status: row.status || "",
    tasks: row.tasks || 0,
    progress: row.progress || 0,
    membersCount: row.members_count || 0,
    userRole: (userId && row.user_id === userId ? "owner" : row.current_user_role || (["owner", "admin"].includes(String(row.current_workspace_role).toLowerCase()) ? "admin" : undefined)) as any,
  };
}

export async function insertProject(data: CreateProjectInput, userId?: string): Promise<Project> {
  const id = crypto.randomUUID();
  let workspaceId: string | null = null;
  if (userId) {
    const { ensurePrimaryWorkspace } = await import("@/lib/workspace");
    const userResult = await pool.query("SELECT name FROM users WHERE id = $1", [userId]);
    const workspace = await ensurePrimaryWorkspace(userId, userResult.rows[0]?.name || "My");
    workspaceId = workspace.id;
  }
  const res = await pool.query(
    `INSERT INTO projects (id, user_id, workspace_id, title, description, category, status, tasks_count, progress)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      userId || null,
      workspaceId,
      data.title,
      data.description || "",
      data.category,
      data.status,
      data.tasks || 0,
      data.progress || 0,
    ]
  );
  const row = res.rows[0];

  // Auto assign creator as 'Owner' in project_members
  if (userId) {
    const memberId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO project_members (id, project_id, user_id, role)
       VALUES ($1, $2, $3, 'owner')
       ON CONFLICT (project_id, user_id) 
       DO UPDATE SET role = 'owner', deleted_at = NULL, updated_at = NOW()`,
      [memberId, id, userId]
    ).catch(() => {});
  }

  return {
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id || undefined,
    title: row.title,
    description: row.description || "",
    category: row.category || "",
    status: row.status || "",
    tasks: row.tasks_count || 0,
    progress: row.progress || 0,
    membersCount: 1,
  };
}

export async function updateProjectById(
  id: string,
  data: UpdateProjectInput,
  userId?: string
): Promise<Project | null> {
  const existing = await findProjectById(id, userId);
  if (!existing) return null;

  const fields: string[] = [];
  const params: any[] = [id];

  if (data.title !== undefined) {
    fields.push(`title = $${params.length + 1}`);
    params.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${params.length + 1}`);
    params.push(data.description);
  }
  if (data.category !== undefined) {
    fields.push(`category = $${params.length + 1}`);
    params.push(data.category);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${params.length + 1}`);
    params.push(data.status);
  }
  if (data.progress !== undefined) {
    fields.push(`progress = $${params.length + 1}`);
    params.push(data.progress);
  }

  fields.push(`updated_at = NOW()`);

  await pool.query(
    `UPDATE projects SET ${fields.join(", ")} WHERE id = $1`,
    params
  );

  return findProjectById(id, userId);
}

export async function deleteProjectById(id: string, userId?: string): Promise<boolean> {
  let query = "UPDATE projects SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL";
  const params: any[] = [id];
  if (userId) {
    query += " AND user_id = $2";
    params.push(userId);
  }
  const res = await pool.query(query, params);
  return (res.rowCount ?? 0) > 0;
}
