import { validateAdminAuth } from "@/lib/api-auth";
import {
  errorResponse,
  internalServerErrorResponse,
  notFoundResponse,
  paginatedResponse,
} from "@/lib/response";
import { findTaskById, findTaskActivities } from "@/app/(backend)/api/tasks/query";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  const { id: taskId } = await params;
  try {
    const task = await findTaskById(taskId, auth.user?.userId);
    if (!task) {
      return notFoundResponse("Task not found or unauthorized");
    }

    const activities = await findTaskActivities(taskId);
    return paginatedResponse(activities, { total: activities.length });
  } catch (error: any) {
    return internalServerErrorResponse(error?.message || "Failed to fetch activities");
  }
}
