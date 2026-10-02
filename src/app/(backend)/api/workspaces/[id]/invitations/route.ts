import { pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { createWorkspaceInvitation, findPendingWorkspaceInvitations } from "@/lib/invitations";
import { createNotification } from "@/lib/notifications";
import { badRequestResponse, errorResponse, successResponse } from "@/lib/response";
import { canManageWorkspace } from "@/lib/workspace";

interface Props { params: Promise<{ id: string }> }

async function roleFor(workspaceId: string, userId: string) {
  const result = await pool.query(`SELECT wm.role, w.name FROM workspace_members wm JOIN workspaces w ON w.id = wm.workspace_id WHERE wm.workspace_id = $1 AND wm.user_id = $2 AND wm.status = 'active' AND wm.deleted_at IS NULL AND w.deleted_at IS NULL`, [workspaceId, userId]);
  return result.rows[0] as { role: string; name: string } | undefined;
}

export async function GET(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id } = await params;
  const actor = await roleFor(id, auth.user.userId);
  if (!actor || !canManageWorkspace(actor.role)) return errorResponse("Only workspace owners and administrators can view invitations", 403);
  return successResponse(await findPendingWorkspaceInvitations(id));
}

export async function POST(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id } = await params;
  const actor = await roleFor(id, auth.user.userId);
  if (!actor || !canManageWorkspace(actor.role)) return errorResponse("Only workspace owners and administrators can create invitations", 403);
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body.role === "string" ? body.role.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) return badRequestResponse("A valid email address is required");
  if (!["admin", "member", "guest"].includes(role)) return badRequestResponse("Invalid workspace role");
  if (actor.role === "admin" && role === "admin") return errorResponse("Only the workspace owner can invite administrators", 403);
  const existing = await pool.query(`SELECT 1 FROM users u JOIN workspace_members wm ON wm.user_id = u.id WHERE wm.workspace_id = $1 AND LOWER(u.email) = $2 AND wm.status = 'active' AND wm.deleted_at IS NULL`, [id, email]);
  if (existing.rows.length) return badRequestResponse("This user is already a workspace member");
  const invitation = await createWorkspaceInvitation({ workspaceId: id, email, workspaceRole: role, invitedBy: auth.user.userId });
  const acceptPath = `/invitations/accept?token=${encodeURIComponent(invitation.token)}`;
  const account = await pool.query(`SELECT id FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`, [email]);
  if (account.rows[0]?.id) await createNotification({ userId: account.rows[0].id, title: "Workspace invitation", message: `${auth.user.name} invited you to ${actor.name}`, link: acceptPath });
  await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "invitation_created", entityType: "workspace", entityId: id, summary: `Invited ${email} to ${actor.name}`, metadata: { role, invitationId: invitation.id } });
  return successResponse({ invitation: { id: invitation.id, email: invitation.email, workspaceRole: invitation.workspace_role, expiresAt: invitation.expires_at }, acceptPath }, "Invitation created", { status: 201 });
}