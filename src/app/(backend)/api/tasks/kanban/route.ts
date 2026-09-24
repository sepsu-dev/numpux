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

  const allTasks = await findTasks(authUser?.userId, projectId);

  const columns = [
    {
      id: "todo",
      title: "To Do",
      tasks: allTasks.filter((t) => t.status === "To Do"),
    },
    {
      id: "inprogress",
      title: "In Progress",
      tasks: allTasks.filter((t) => t.status === "In Progress"),
    },
    {
      id: "review",
      title: "Review",
      tasks: allTasks.filter((t) => t.status === "Review"),
    },
    {
      id: "done",
      title: "Done",
      tasks: allTasks.filter((t) => t.status === "Done"),
    },
  ];

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
