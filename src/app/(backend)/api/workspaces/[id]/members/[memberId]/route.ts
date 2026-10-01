import { pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { badRequestResponse, errorResponse, notFoundResponse, successResponse } from "@/lib/response";
import { canManageWorkspace } from "@/lib/workspace";
import { recordAudit } from "@/lib/audit";

interface Props { params: Promise<{ id: string; memberId: string }> }

async function context(workspaceId: string, memberId: string, actorId: string) {
  const [actor, target] = await Promise.all([
    pool.query(`SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND status = 'active' AND deleted_at IS NULL`, [workspaceId, actorId]),
    pool.query(`SELECT id, user_id, role FROM workspace_members WHERE workspace_id = $1 AND id = $2 AND status = 'active' AND deleted_at IS NULL`, [workspaceId, memberId]),
  ]);
  return { actorRole: actor.rows[0]?.role as string | undefined, target: target.rows[0] as { id: string; user_id: string; role: string } | undefined };
}

export async function PATCH(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id: workspaceId, memberId } = await params;
  const { actorRole, target } = await context(workspaceId, memberId, auth.user.userId);
  if (!canManageWorkspace(actorRole) && auth.user.role !== "superadmin") return errorResponse("Only workspace owners and administrators can change member roles", 403);
  if (!target) return notFoundResponse("Workspace member not found");
  if (target.role === "owner") return badRequestResponse("Use ownership transfer to change the workspace owner");
  const body = await request.json();
  const role = typeof body.role === "string" ? body.role.trim().toLowerCase() : "";
  if (!["admin", "member", "guest"].includes(role)) return badRequestResponse("Invalid workspace role");
  if (actorRole === "admin" && (target.role === "admin" || role === "admin")) return errorResponse("Only the workspace owner can manage administrators", 403);
  await pool.query(`UPDATE workspace_members SET role = $3, updated_at = NOW() WHERE workspace_id = $1 AND id = $2`, [workspaceId, memberId, role]);
  await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "workspace_role_changed", entityType: "workspace", entityId: workspaceId, summary: `Changed a workspace member role to ${role}`, metadata: { memberId, role } });
  return successResponse({ memberId, role }, "Workspace role updated");
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id: workspaceId, memberId } = await params;
  const { actorRole, target } = await context(workspaceId, memberId, auth.user.userId);
  if (!canManageWorkspace(actorRole) && auth.user.role !== "superadmin") return errorResponse("Only workspace owners and administrators can remove members", 403);
  if (!target) return notFoundResponse("Workspace member not found");
  if (target.role === "owner") return badRequestResponse("The workspace owner cannot be removed");
  if (actorRole === "admin" && target.role === "admin") return errorResponse("Only the workspace owner can remove administrators", 403);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE workspace_members SET status = 'removed', deleted_at = NOW(), updated_at = NOW() WHERE workspace_id = $1 AND id = $2`, [workspaceId, memberId]);
    await client.query(`UPDATE project_members pm SET deleted_at = NOW(), updated_at = NOW() FROM projects p WHERE pm.project_id = p.id AND p.workspace_id = $1 AND pm.user_id = $2 AND LOWER(pm.role) <> 'owner' AND pm.deleted_at IS NULL`, [workspaceId, target.user_id]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "workspace_member_removed", entityType: "workspace", entityId: workspaceId, summary: "Removed a workspace member", metadata: { memberId } });
  return successResponse({ memberId }, "Workspace member removed");
}
