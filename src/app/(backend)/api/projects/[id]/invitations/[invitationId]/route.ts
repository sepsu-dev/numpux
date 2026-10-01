import { validateAdminAuth } from "@/lib/api-auth";
import { revokeInvitation } from "@/lib/invitations";
import { errorResponse, notFoundResponse, successResponse } from "@/lib/response";
import { canManageProject, findProjectAccess } from "@/lib/workspace";
import { recordAudit } from "@/lib/audit";

interface Props { params: Promise<{ id: string; invitationId: string }> }

export async function DELETE(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id: projectId, invitationId } = await params;
  const access = await findProjectAccess(auth.user.userId, projectId);
  if (!access || !canManageProject(access.projectRole)) return errorResponse("Only project owners and administrators can revoke invitations", 403);
  const revoked = await revokeInvitation(invitationId, projectId);
  if (!revoked) return notFoundResponse("Pending invitation not found");
  await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "invitation_revoked", entityType: "project", entityId: projectId, summary: "Revoked a project invitation", metadata: { invitationId } });
  return successResponse({ invitationId }, "Invitation revoked");
}
