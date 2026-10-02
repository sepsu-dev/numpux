import { pool } from "@/db";

export type WorkspaceRole = "owner" | "admin" | "member" | "guest";
export type ProjectAccessRole = "owner" | "admin" | "contributor" | "viewer";

function workspaceSlug(userId: string) {
  return `workspace-${userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16).toLowerCase()}`;
}

export async function createPersonalWorkspace(userId: string, userName: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      `SELECT w.id, w.name, wm.role
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = $1 AND wm.role = 'owner' AND wm.status = 'active'
         AND wm.deleted_at IS NULL AND w.deleted_at IS NULL
       ORDER BY w.created_at ASC LIMIT 1`,
      [userId]
    );
    if (existing.rows.length) {
      await client.query("COMMIT");
      return existing.rows[0];
    }

    const workspaceId = crypto.randomUUID();
    const memberId = crypto.randomUUID();
    const name = `${userName.trim() || "My"}'s Workspace`;
    const slug = workspaceSlug(userId);
    const created = await client.query(
      `INSERT INTO workspaces (id, name, slug, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name`,
      [workspaceId, name, slug, userId]
    );
    await client.query(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, status)
       VALUES ($1, $2, $3, 'owner', 'active')`,
      [memberId, workspaceId, userId]
    );
    await client.query("UPDATE users SET active_workspace_id = COALESCE(active_workspace_id, $2) WHERE id = $1", [userId, workspaceId]);
    await client.query("COMMIT");
    return { ...created.rows[0], role: "owner" as const };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findPrimaryWorkspace(userId: string) {
  const result = await pool.query(
    `SELECT w.id, w.name, w.slug, wm.role
     FROM workspace_members wm
     JOIN workspaces w ON w.id = wm.workspace_id
     JOIN users account_user ON account_user.id = wm.user_id
     WHERE wm.user_id = $1 AND wm.status = 'active'
       AND wm.deleted_at IS NULL AND w.deleted_at IS NULL
     ORDER BY CASE WHEN account_user.active_workspace_id = w.id THEN 0 ELSE 1 END,
              CASE wm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'member' THEN 3 ELSE 4 END,
              wm.joined_at ASC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function ensureActiveWorkspace(userId: string, userName: string) {
  const workspace = await findPrimaryWorkspace(userId) || await createPersonalWorkspace(userId, userName);
  await pool.query(
    `UPDATE users
     SET active_workspace_id = $2, updated_at = NOW()
     WHERE id = $1 AND active_workspace_id IS DISTINCT FROM $2`,
    [userId, workspace.id]
  );
  return workspace;
}

export async function ensureActiveWorkspaceForUser(userId: string) {
  const user = await pool.query("SELECT name FROM users WHERE id = $1 AND deleted_at IS NULL", [userId]);
  if (!user.rows.length) throw new Error("User not found");
  return ensureActiveWorkspace(userId, user.rows[0].name || "My");
}

export async function ensurePrimaryWorkspace(userId: string, userName: string) {
  return ensureActiveWorkspace(userId, userName);
}

export async function findProjectAccess(userId: string, projectId: string) {
  const result = await pool.query(
    `SELECT p.id AS project_id, p.workspace_id,
            CASE
              WHEN p.user_id = $1 THEN 'owner'
              WHEN pm.user_id IS NOT NULL THEN LOWER(pm.role)
              WHEN LOWER(wm.role) IN ('owner', 'admin') THEN 'admin'
              ELSE 'viewer'
            END AS project_role,
            LOWER(wm.role) AS workspace_role
     FROM projects p
     JOIN users account_user ON account_user.id = $1 AND account_user.active_workspace_id = p.workspace_id
     LEFT JOIN project_members pm
       ON pm.project_id = p.id AND pm.user_id = $1 AND pm.deleted_at IS NULL
     LEFT JOIN workspace_members wm
       ON wm.workspace_id = p.workspace_id AND wm.user_id = $1
      AND wm.status = 'active' AND wm.deleted_at IS NULL
     WHERE p.id = $2 AND p.deleted_at IS NULL
       AND wm.user_id IS NOT NULL
       AND (p.user_id = $1 OR pm.user_id IS NOT NULL OR LOWER(wm.role) IN ('owner', 'admin'))
     LIMIT 1`,
    [userId, projectId]
  );
  if (!result.rows.length) return null;
  return {
    projectId: result.rows[0].project_id as string,
    workspaceId: result.rows[0].workspace_id as string,
    projectRole: (result.rows[0].project_role || "viewer") as ProjectAccessRole,
    workspaceRole: (result.rows[0].workspace_role || "guest") as WorkspaceRole,
  };
}

export function canManageProject(role?: string | null) {
  return role === "owner" || role === "admin";
}

export function canContributeToProject(role?: string | null) {
  return role === "owner" || role === "admin" || role === "contributor" || role === "member";
}

export function canManageWorkspace(role?: string | null) {
  return role === "owner" || role === "admin";
}
