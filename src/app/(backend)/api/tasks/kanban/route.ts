import { validatePublicKey, validateAdminAuth, getOptionalAuthUser } from "@/lib/api-auth";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/response";
import { kanbanPatchSchema } from "../schema";
import { findTasks, updateTaskById } from "../query";
import { initDb } from "@/db";
import { findAllMasterData } from "@/app/(backend)/api/master-data/query";

export async function GET(request: Request) {
  const { isValid } = validatePublicKey(request);
  if (!isValid) {
    return unauthorizedResponse(
      "Unauthorized. Missing or invalid public key. Provide 'X-Public-Key' header or '?public_key=' query parameter."
    );
  }

  const authUser = await getOptionalAuthUser(request);
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || undefined;

  await initDb();
  const [allTasks, masterData] = await Promise.all([
    findTasks(authUser?.userId, projectId),
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

    return successResponse(updated, `Task moved to ${targetStatus}`);
  } catch (error) {
    console.error("PATCH /api/tasks/kanban error:", error);
    return internalServerErrorResponse("Failed to update task status");
  }
}
