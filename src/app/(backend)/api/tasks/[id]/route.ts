import { validateAdminAuth } from "@/lib/api-auth";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  notFoundResponse,
  successResponse,
} from "@/lib/response";
import { updateTaskSchema } from "../schema";
import { findTaskById, updateTaskById, deleteTaskById } from "../query";
import { recordAudit } from "@/lib/audit";
import { canContributeToProject, canManageProject, findProjectAccess } from "@/lib/workspace";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id } = await params;
  const task = await findTaskById(id, auth.user.userId);

  if (!task) {
    return notFoundResponse(`Task #${id} not found`);
  }

  return successResponse(task);
}

export async function PUT(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid task update data",
        parsed.error.flatten().fieldErrors
      );
    }

    const existing = await findTaskById(id, auth.user.userId);
    if (!existing) return notFoundResponse(`Task #${id} not found or unauthorized`);
    const access = await findProjectAccess(auth.user.userId, existing.projectId);
    if (!access || !canContributeToProject(access.projectRole)) return errorResponse("You do not have permission to update this task", 403);
    if (access.projectRole === "contributor" && existing.userId !== auth.user.userId && existing.assigneeId !== auth.user.userId) {
      return errorResponse("Contributors can only edit tasks they created or are assigned to", 403);
    }
    if (parsed.data.projectId && parsed.data.projectId !== existing.projectId) {
      if (!canManageProject(access.projectRole)) return errorResponse("Only project owners and administrators can move tasks between projects", 403);
      const destination = await findProjectAccess(auth.user.userId, parsed.data.projectId);
      if (!destination || !canManageProject(destination.projectRole)) return errorResponse("You cannot move tasks to that project", 403);
    }

    const updated = await updateTaskById(id, parsed.data, auth.user?.userId);

    if (!updated) {
      return notFoundResponse(`Task #${id} not found or unauthorized`);
    }

    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "updated", entityType: "task", entityId: id, summary: `Updated task ${updated.key || updated.title}`, metadata: parsed.data });

    return successResponse(updated, "Task updated successfully");
  } catch (error) {
    console.error(`PUT /api/tasks/${id} error:`, error);
    return internalServerErrorResponse("Failed to update task");
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  const { id } = await params;
  try {
    const task = await findTaskById(id, auth.user.userId);
    if (!task) return notFoundResponse(`Task #${id} not found or unauthorized`);
    const access = await findProjectAccess(auth.user.userId, task.projectId);
    if (!access || !canManageProject(access.projectRole)) return errorResponse("Only project owners and administrators can archive tasks", 403);
    const deleted = await deleteTaskById(id, auth.user?.userId);
    if (!deleted) {
      return notFoundResponse(`Task #${id} not found or unauthorized`);
    }

    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "deleted", entityType: "task", entityId: id, summary: `Moved task ${id} to trash` });

    return successResponse({ id }, `Task #${id} deleted successfully`);
  } catch (error) {
    console.error(`DELETE /api/tasks/${id} error:`, error);
    return internalServerErrorResponse("Failed to delete task");
  }
}
