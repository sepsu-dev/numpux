import { initDb } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { acceptInvitation, findInvitationByToken } from "@/lib/invitations";
import { createNotification } from "@/lib/notifications";
import { badRequestResponse, errorResponse, internalServerErrorResponse, notFoundResponse, successResponse } from "@/lib/response";

export async function GET(request: Request) {
  await initDb();
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) return badRequestResponse("Invitation token is required");
  const invitation = await findInvitationByToken(token);
  if (!invitation) return notFoundResponse("Invitation not found");
  const isExpired = new Date(invitation.expiresAt).getTime() <= Date.now();
  return successResponse({
    email: invitation.email,
    workspaceName: invitation.workspaceName,
    projectName: invitation.projectName,
    projectRole: invitation.projectRole,
    inviterName: invitation.inviterName,
    status: isExpired && invitation.status === "pending" ? "expired" : invitation.status,
    expiresAt: invitation.expiresAt,
  });
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  try {
    await initDb();
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) return badRequestResponse("Invitation token is required");
    const accepted = await acceptInvitation(token, { id: auth.user.userId, email: auth.user.email });
    await createNotification({
      userId: auth.user.userId,
      title: "Invitation accepted",
      message: "You now have access to the invited workspace and project.",
      link: accepted.projectId ? `/tasks/kanban?projectId=${accepted.projectId}` : "/projects",
    });
    return successResponse(accepted, "Invitation accepted successfully");
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Failed to accept invitation");
  }
}
