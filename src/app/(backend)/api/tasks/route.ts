import { validatePublicKey, validateAdminAuth, getOptionalAuthUser } from "@/lib/api-auth";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  paginatedResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/response";
import { createTaskSchema, listTasksQuerySchema } from "./schema";
import { findTasks, insertTask } from "./query";
import { recordAudit } from "@/lib/audit";
import { canContributeToProject, findProjectAccess } from "@/lib/workspace";

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { searchParams } = new URL(request.url);
  const parsed = listTasksQuerySchema.safeParse({
    status: searchParams.get("status") || undefined,
    priority: searchParams.get("priority") || undefined,
    project: searchParams.get("project") || undefined,
    projectId: searchParams.get("projectId") || undefined,
  });

  if (!parsed.success) {
    return badRequestResponse("Invalid query parameters", parsed.error.flatten().fieldErrors);
  }

  const { status, priority, project, projectId } = parsed.data;

  // Scoped to authenticated user
  let tasks = await findTasks(auth.user.userId, projectId || undefined);

  if (status) {
    tasks = tasks.filter((t) => t.status.toLowerCase() === status.toLowerCase());
  }
  if (priority) {
    tasks = tasks.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
  }
  if (project) {
    tasks = tasks.filter((t) => t.project.toLowerCase() === project.toLowerCase());
  }

  return paginatedResponse(tasks, { total: tasks.length });
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid task input data",
        parsed.error.flatten().fieldErrors
      );
    }

    const access = await findProjectAccess(auth.user.userId, parsed.data.projectId);
    if (!access || !canContributeToProject(access.projectRole)) {
      return errorResponse("You do not have permission to create tasks in this project", 403);
    }

    const newTask = await insertTask(parsed.data, auth.user?.userId);
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "created", entityType: "task", entityId: newTask.id, summary: `Created task ${newTask.key || newTask.title}`, metadata: { projectId: newTask.projectId } });
    return successResponse(newTask, "Task created successfully", { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return internalServerErrorResponse(error?.message || "Failed to process task data");
  }
}
