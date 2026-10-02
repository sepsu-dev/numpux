import { validateAdminAuth } from "@/lib/api-auth";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  notFoundResponse,
  successResponse,
} from "@/lib/response";
import { kanbanPatchSchema } from "../schema";
import { findTasks, updateTaskById } from "../query";
import { initDb } from "@/db";
import { findAllMasterData } from "@/app/(backend)/api/master-data/query";
import { recordAudit } from "@/lib/audit";

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || undefined;

  await initDb();
  const [allTasks, masterData] = await Promise.all([
    findTasks(auth.user.userId, projectId),
    findAllMasterData(),
  ]);
  const configuredIds = new Set(masterData.statuses.map((status) => status.id));
  const orphanStatuses = Array.from(new Set(allTasks.map((task) => task.status).filter((status) => !configuredIds.has(status))));
  const columns = [
    ...masterData.statuses,
    ...orphanStatuses.map((status, index) => ({ id: status, name: status, order: masterData.statuses.length + index + 1 })),
  ].map((status) => ({
    id: status.id,
    title: status.name,
    tasks: allTasks.filter((task) => task.status === status.id),
  }));

  return successResponse(columns);
}

export async function PATCH(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  try {
    const body = await request.json();
    const parsed = kanbanPatchSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid kanban status update",
        parsed.error.flatten().fieldErrors
      );
    }

    const { taskId, targetStatus } = parsed.data;
    const updated = await updateTaskById(taskId, { status: targetStatus }, auth.user?.userId);

    if (!updated) {
      return notFoundResponse(`Task #${taskId} not found or unauthorized`);
    }

    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "status_changed", entityType: "task", entityId: taskId, summary: `Moved task ${updated.key || updated.title} to ${targetStatus}`, metadata: { status: targetStatus } });

    return successResponse(updated, `Task moved to ${targetStatus}`);
  } catch (error) {
    console.error("PATCH /api/tasks/kanban error:", error);
    return internalServerErrorResponse("Failed to update task status");
  }
}
