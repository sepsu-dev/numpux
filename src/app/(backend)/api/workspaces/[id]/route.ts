import { pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { badRequestResponse, errorResponse, internalServerErrorResponse, notFoundResponse, successResponse } from "@/lib/response";
import { canManageWorkspace } from "@/lib/workspace";
import { recordAudit } from "@/lib/audit";

interface Props { params: Promise<{ id: string }> }

async function membership(workspaceId: string, userId: string) {
  const result = await pool.query(`SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND status = 'active' AND deleted_at IS NULL`, [workspaceId, userId]);
  return result.rows[0]?.role as string | undefined;
}

export async function GET(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id } = await params;
  const role = await membership(id, auth.user.userId);
  if (!role && auth.user.role !== "superadmin") return notFoundResponse("Workspace not found");
  const [workspace, members] = await Promise.all([
    pool.query(`SELECT id, name, slug, status, created_at FROM workspaces WHERE id = $1 AND deleted_at IS NULL`, [id]),
    pool.query(`SELECT wm.id, wm.user_id, wm.role, wm.status, wm.joined_at, u.name, u.email FROM workspace_members wm JOIN users u ON u.id = wm.user_id WHERE wm.workspace_id = $1 AND wm.deleted_at IS NULL ORDER BY CASE wm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, wm.joined_at`, [id]),
  ]);
  if (!workspace.rows.length) return notFoundResponse("Workspace not found");
  return successResponse({ workspace: { ...workspace.rows[0], currentUserRole: role || "superadmin" }, members: members.rows.map((row) => ({ id: row.id, userId: row.user_id, name: row.name, email: row.email, role: row.role, status: row.status, joinedAt: row.joined_at })) });
}

export async function PATCH(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id } = await params;
  const role = await membership(id, auth.user.userId);
  if (auth.user.role !== "superadmin" && !canManageWorkspace(role)) return errorResponse("Only workspace owners and administrators can update this workspace", 403);
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 100) return badRequestResponse("Workspace name must contain 2 to 100 characters");
    const result = await pool.query(`UPDATE workspaces SET name = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id, name, slug, status`, [id, name]);
    if (!result.rows.length) return notFoundResponse("Workspace not found");
    return successResponse(result.rows[0], "Workspace updated");
  } catch (error) {
    return internalServerErrorResponse("Failed to update workspace");
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id } = await params;
  const client = await pool.connect();
  let name = "";
  let fallbackWorkspaceId: string | null = null;
  try {
    await client.query("BEGIN");
    const workspace = await client.query(`SELECT w.name FROM workspaces w JOIN workspace_members wm ON wm.workspace_id = w.id WHERE w.id = $1 AND wm.user_id = $2 AND wm.role = 'owner' AND wm.status = 'active' AND wm.deleted_at IS NULL AND w.deleted_at IS NULL FOR UPDATE OF w`, [id, auth.user.userId]);
    if (!workspace.rows.length) { await client.query("ROLLBACK"); return errorResponse("Only the workspace owner can delete it", 403); }
    name = workspace.rows[0].name;
    const projects = await client.query(`SELECT COUNT(*)::int AS count FROM projects WHERE workspace_id = $1`, [id]);
    if (projects.rows[0].count > 0) { await client.query("ROLLBACK"); return badRequestResponse("Delete or permanently remove every project before deleting this workspace"); }
    const fallback = await client.query(`SELECT w.id FROM workspace_members wm JOIN workspaces w ON w.id = wm.workspace_id WHERE wm.user_id = $1 AND wm.workspace_id <> $2 AND wm.status = 'active' AND wm.deleted_at IS NULL AND w.deleted_at IS NULL ORDER BY CASE wm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'member' THEN 3 ELSE 4 END, wm.joined_at LIMIT 1`, [auth.user.userId, id]);
    fallbackWorkspaceId = fallback.rows[0]?.id || null;
    if (!fallbackWorkspaceId) {
      fallbackWorkspaceId = crypto.randomUUID();
      const personalName = `${auth.user.name.trim() || "My"}'s Workspace`;
      const slug = `workspace-${auth.user.userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toLowerCase()}-${fallbackWorkspaceId.slice(0, 8)}`;
      await client.query(`INSERT INTO workspaces (id, name, slug, created_by) VALUES ($1, $2, $3, $4)`, [fallbackWorkspaceId, personalName, slug, auth.user.userId]);
      await client.query(`INSERT INTO workspace_members (id, workspace_id, user_id, role, status) VALUES ($1, $2, $3, 'owner', 'active')`, [crypto.randomUUID(), fallbackWorkspaceId, auth.user.userId]);
    }
    await client.query(`UPDATE users SET active_workspace_id = $2, updated_at = NOW() WHERE id = $1 AND active_workspace_id = $3`, [auth.user.userId, fallbackWorkspaceId, id]);
    await client.query(`DELETE FROM workspaces WHERE id = $1`, [id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("DELETE /api/workspaces/[id] error:", error);
    return internalServerErrorResponse("Failed to delete workspace");
  } finally { client.release(); }
  await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "workspace_deleted", entityType: "workspace", entityId: id, summary: `Deleted workspace ${name}`, metadata: { fallbackWorkspaceId } })
    .catch((auditError) => console.error("Workspace deletion audit failed:", auditError));
  return successResponse({ id, activeWorkspaceId: fallbackWorkspaceId }, "Workspace deleted");
}
