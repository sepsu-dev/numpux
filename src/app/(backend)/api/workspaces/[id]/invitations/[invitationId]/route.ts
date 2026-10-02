import { pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { revokeWorkspaceInvitation } from "@/lib/invitations";
import { errorResponse, notFoundResponse, successResponse } from "@/lib/response";
import { canManageWorkspace } from "@/lib/workspace";

interface Props { params: Promise<{ id: string; invitationId: string }> }

export async function DELETE(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id, invitationId } = await params;
  const actor = await pool.query(`SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND status = 'active' AND deleted_at IS NULL`, [id, auth.user.userId]);
  if (!canManageWorkspace(actor.rows[0]?.role)) return errorResponse("Only workspace owners and administrators can revoke invitations", 403);
  if (!(await revokeWorkspaceInvitation(invitationId, id))) return notFoundResponse("Pending invitation not found");
  await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "invitation_revoked", entityType: "workspace", entityId: id, summary: "Revoked a workspace invitation", metadata: { invitationId } });
  return successResponse({ invitationId }, "Invitation revoked");
}