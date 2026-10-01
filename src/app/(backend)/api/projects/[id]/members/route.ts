import { pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { findProjectById } from "@/app/(backend)/api/projects/query";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  notFoundResponse,
  successResponse,
} from "@/lib/response";
import { addProjectMemberSchema } from "./schema";
import { findProjectMembers, projectGroupExists } from "./query";
import { recordAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { createProjectInvitation, findPendingProjectInvitations } from "@/lib/invitations";
import { canManageProject, canManageWorkspace, findProjectAccess } from "@/lib/workspace";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  const { id: projectId } = await params;
  try {
    const project = await findProjectById(projectId, auth.user?.userId);
    if (!project) {
      return notFoundResponse("Project not found or unauthorized");
    }
    const access = await findProjectAccess(auth.user.userId, projectId);
    const [members, invitations] = await Promise.all([
      findProjectMembers(projectId),
      access && canManageProject(access.projectRole) ? findPendingProjectInvitations(projectId) : Promise.resolve([]),
    ]);
    return successResponse({ members, invitations, total: members.length });
  } catch (error: any) {
    return internalServerErrorResponse(error?.message || "Failed to fetch project members");
  }
}

export async function POST(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  const { id: projectId } = await params;
  try {
    const project = await findProjectById(projectId, auth.user?.userId);
    if (!project) {
      return notFoundResponse("Project not found or unauthorized");
    }
    const access = await findProjectAccess(auth.user.userId, projectId);
    if (!access || !canManageProject(access.projectRole)) {
      return errorResponse("Only project owners and administrators can add members", 403);
    }

    const body = await request.json();
    const parsed = addProjectMemberSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid member data",
        parsed.error.flatten().fieldErrors
      );
    }

    const { email } = parsed.data;
    const role = parsed.data.role.trim().toLowerCase();
    if (role === "owner") return badRequestResponse("Ownership can only be assigned through the transfer ownership action");
    if (access.projectRole === "admin" && role === "admin") return errorResponse("Only the project owner can assign project administrators", 403);
    if (!(await projectGroupExists(role))) return badRequestResponse("Selected project role does not exist");

    if (!access.workspaceId) return badRequestResponse("Project is not connected to a workspace");
    const target = await pool.query(
      `SELECT u.id, EXISTS (
         SELECT 1 FROM workspace_members wm
         WHERE wm.workspace_id = $2 AND wm.user_id = u.id
           AND wm.status = 'active' AND wm.deleted_at IS NULL
       ) AS is_workspace_member
       FROM users u WHERE LOWER(u.email) = LOWER($1) AND u.deleted_at IS NULL LIMIT 1`,
      [email.trim(), access.workspaceId]
    );
    if ((!target.rows.length || !target.rows[0].is_workspace_member)
      && auth.user.role !== "superadmin"
      && !canManageWorkspace(access.workspaceRole)) {
      return errorResponse("Only workspace owners and administrators can invite a new email address", 403);
    }

    const invitation = await createProjectInvitation({
      projectId,
      workspaceId: access.workspaceId,
      email,
      projectRole: role,
      invitedBy: auth.user.userId,
    });
    const acceptPath = `/invitations/accept?token=${encodeURIComponent(invitation.token)}`;
    if (target.rows[0]?.id) {
      await createNotification({ userId: target.rows[0].id, title: "Project invitation", message: `${auth.user.name} invited you to ${project.title}`, link: acceptPath });
    }
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "invitation_created", entityType: "project", entityId: projectId, summary: `Invited ${email.trim().toLowerCase()} to ${project.title}`, metadata: { role, invitationId: invitation.id } });

    return successResponse(
      { invitation: { id: invitation.id, email: invitation.email, projectRole: invitation.project_role, expiresAt: invitation.expires_at }, acceptPath },
      "Invitation created successfully",
      { status: 201 }
    );
  } catch (error: any) {
    return internalServerErrorResponse(error?.message || "Failed to add project member");
  }
}
