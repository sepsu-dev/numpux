import { validateAdminAuth } from "@/lib/api-auth";
import { findProjectById } from "@/app/(backend)/api/projects/query";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  notFoundResponse,
  successResponse,
} from "@/lib/response";
import { deleteProjectMember } from "../query";

interface Props {
  params: Promise<{ id: string; memberId: string }>;
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

    const removed = await deleteProjectMember(projectId, memberId);
    if (!removed) {
      return badRequestResponse("Cannot remove project owner or member not found");
    }

    return successResponse({ memberId }, "Member removed from project");
  } catch (error: any) {
    return internalServerErrorResponse(error?.message || "Failed to remove member");
  }
}
