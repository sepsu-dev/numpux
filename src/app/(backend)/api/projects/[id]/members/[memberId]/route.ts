import { validateAdminAuth } from "@/lib/api-auth";
import { findProjectById } from "@/app/(backend)/api/projects/query";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  notFoundResponse,
  successResponse,
} from "@/lib/response";
import { deleteProjectMember, projectGroupExists, transferProjectOwnership, updateProjectMemberRole } from "../query";
import { recordAudit } from "@/lib/audit";

interface Props {
  params: Promise<{ id: string; memberId: string }>;
}

export async function PUT(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id: projectId, memberId } = await params;
  const project = await findProjectById(projectId, auth.user.userId);
  if (!project) return notFoundResponse("Project not found or unauthorized");
  const body = await request.json();
  if (body.action === "transfer_ownership") {
    if ((project.userRole || "").toLowerCase() !== "owner") return errorResponse("Only the project owner can transfer ownership", 403);
    const transferred = await transferProjectOwnership(projectId, memberId);
    if (!transferred) return badRequestResponse("Target member not found");
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "ownership_transferred", entityType: "project", entityId: projectId, summary: "Transferred project ownership", metadata: { memberId } });
    return successResponse({ memberId }, "Project ownership transferred");
  }
  if (!["owner", "admin"].includes((project.userRole || "").toLowerCase())) return errorResponse("Only project owners and administrators can change member roles", 403);
  if (!body.role || typeof body.role !== "string") return badRequestResponse("Role is required");
  const requestedRole = body.role.trim().toLowerCase();
  if (requestedRole === "owner") return badRequestResponse("Use the ownership transfer action to assign an owner");
  if ((project.userRole || "").toLowerCase() === "admin" && requestedRole === "admin") return errorResponse("Only the project owner can assign project administrators", 403);
  if (!(await projectGroupExists(body.role))) return badRequestResponse("Selected project role does not exist");
  const updated = await updateProjectMemberRole(projectId, memberId, requestedRole);
  if (!updated) return badRequestResponse("Project owner role cannot be changed");
  await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "member_role_changed", entityType: "project", entityId: projectId, summary: `Changed a project member role to ${requestedRole}`, metadata: { memberId, role: requestedRole } });
  return successResponse({ memberId, role: requestedRole }, "Member role updated");
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  const { id: projectId, memberId } = await params;
  try {
    const project = await findProjectById(projectId, auth.user?.userId);
    if (!project) {
      return notFoundResponse("Project not found or unauthorized");
    }
    if (!["owner", "admin"].includes((project.userRole || "").toLowerCase())) {
      return errorResponse("Only project owners and administrators can remove members", 403);
    }

    const removed = await deleteProjectMember(projectId, memberId);
    if (!removed) {
      return badRequestResponse("Cannot remove project owner or member not found");
    }
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "member_removed", entityType: "project", entityId: projectId, summary: "Removed a project member", metadata: { memberId } });

    return successResponse({ memberId }, "Member removed from project");
  } catch (error: any) {
    return internalServerErrorResponse(error?.message || "Failed to remove member");
  }
}
