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
  const project = await findProjectById(id, authUser?.userId);

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
    const deleted = await deleteProjectById(id, auth.user?.userId);
    if (!deleted) {
      return notFoundResponse(`Project #${id} not found or unauthorized`);
    }

    return successResponse({ id }, `Project #${id} deleted successfully`);
  } catch (error) {
    console.error(`DELETE /api/projects/${id} error:`, error);
    return internalServerErrorResponse("Failed to delete project");
  }
}
