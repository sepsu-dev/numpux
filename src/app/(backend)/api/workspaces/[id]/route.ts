import { pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { badRequestResponse, errorResponse, internalServerErrorResponse, notFoundResponse, successResponse } from "@/lib/response";
import { canManageWorkspace } from "@/lib/workspace";

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
