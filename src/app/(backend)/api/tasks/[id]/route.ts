import { validatePublicKey, validateAdminAuth, getOptionalAuthUser } from "@/lib/api-auth";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/response";
import { updateTaskSchema } from "../schema";
import { findTaskById, updateTaskById, deleteTaskById } from "../query";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const { isValid } = validatePublicKey(request);
  if (!isValid) {
    return unauthorizedResponse(
      "Unauthorized. Missing or invalid public key. Provide 'X-Public-Key' header or '?public_key=' query parameter."
    );
  }

  const authUser = await getOptionalAuthUser(request);
  const { id } = await params;
  const task = await findTaskById(id, authUser?.userId);

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

    const updated = await updateTaskById(id, parsed.data, auth.user?.userId);

    if (!updated) {
      return notFoundResponse(`Task #${id} not found or unauthorized`);
    }

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
    const deleted = await deleteTaskById(id, auth.user?.userId);
    if (!deleted) {
      return notFoundResponse(`Task #${id} not found or unauthorized`);
    }

    return successResponse({ id }, `Task #${id} deleted successfully`);
  } catch (error) {
    console.error(`DELETE /api/tasks/${id} error:`, error);
    return internalServerErrorResponse("Failed to delete task");
  }
}
