import { validatePublicKey, validateAdminAuth, getOptionalAuthUser } from "@/lib/api-auth";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/response";
import { updateProjectSchema } from "../schema";
import { findProjectById, updateProjectById, deleteProjectById } from "../query";
import { recordAudit } from "@/lib/audit";
import { canManageProject, findProjectAccess } from "@/lib/workspace";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id } = await params;
  const project = await findProjectById(id, auth.user.userId);

  if (!project) {
    return notFoundResponse(`Project #${id} not found`);
  }

  return successResponse(project);
}

export async function PUT(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  const { id } = await params;
  try {
    const access = await findProjectAccess(auth.user.userId, id);
    if (!access || !canManageProject(access.projectRole)) return errorResponse("Only project owners and administrators can update project settings", 403);
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid update data",
        parsed.error.flatten().fieldErrors
      );
    }

    const updated = await updateProjectById(id, parsed.data, auth.user?.userId);

    if (!updated) {
      return notFoundResponse(`Project #${id} not found or unauthorized`);
    }

    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "updated", entityType: "project", entityId: id, summary: `Updated project ${updated.title}`, metadata: parsed.data });

    return successResponse(updated, "Project updated successfully");
  } catch (error) {
    console.error(`PUT /api/projects/${id} error:`, error);
    return internalServerErrorResponse("Failed to update project");
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  const { id } = await params;
  try {
    const access = await findProjectAccess(auth.user.userId, id);
    if (!access || access.projectRole !== "owner") return errorResponse("Only the project owner can delete this project", 403);
    const deleted = await deleteProjectById(id, auth.user?.userId);
    if (!deleted) {
      return notFoundResponse(`Project #${id} not found or unauthorized`);
    }

    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "deleted", entityType: "project", entityId: id, summary: `Moved project ${id} to trash` });

    return successResponse({ id }, `Project #${id} deleted successfully`);
  } catch (error) {
    console.error(`DELETE /api/projects/${id} error:`, error);
    return internalServerErrorResponse("Failed to delete project");
  }
}
