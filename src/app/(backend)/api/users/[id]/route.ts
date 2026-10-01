import { validateAdminAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { badRequestResponse, conflictResponse, errorResponse, internalServerErrorResponse, notFoundResponse, successResponse } from "@/lib/response";
import { findUserAccessById, softDeleteUserById, updateUserById } from "../query";
import { updateUserSchema } from "../schema";

interface Props { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  if (auth.user.role !== "superadmin") return errorResponse("Only the application owner can manage global accounts", 403);
  try {
    const { id } = await params;
    const parsed = updateUserSchema.safeParse(await request.json());
    if (!parsed.success) return badRequestResponse("Invalid user data", parsed.error.flatten().fieldErrors);
    const target = await findUserAccessById(id);
    if (!target) return notFoundResponse("User not found");
    const targetRole = target.role;
    if (id === auth.user.userId && parsed.data.role && parsed.data.role !== targetRole) {
      return badRequestResponse("You cannot change your own system role");
    }
    if (target.accountOrigin === "system" && parsed.data.role && parsed.data.role !== "superadmin") {
      return badRequestResponse("The application owner must retain the super administrator role");
    }
    if (parsed.data.role === "superadmin" && auth.user.role !== "superadmin") return errorResponse("Only a super administrator can assign this role", 403);
    const user = await updateUserById(id, parsed.data);
    if (!user) return notFoundResponse("User not found or no changes provided");
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "updated", entityType: "user", entityId: id, summary: `Updated user ${user.email}`, metadata: parsed.data });
    return successResponse(user, "User updated successfully");
  } catch (error: any) {
    if (error?.code === "23505") return conflictResponse("This email address is already in use");
    return internalServerErrorResponse("Failed to update user");
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  if (auth.user.role !== "superadmin") return errorResponse("Only the application owner can manage global accounts", 403);
  const { id } = await params;
  if (id === auth.user.userId) return badRequestResponse("You cannot delete your own account");
  try {
    const target = await findUserAccessById(id);
    if (!target) return notFoundResponse("User not found");
    const targetRole = target.role;
    if (target.accountOrigin === "system") return badRequestResponse("The application owner cannot be deleted");
    const deleted = await softDeleteUserById(id);
    if (!deleted) return notFoundResponse("User not found");
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "deleted", entityType: "user", entityId: id, summary: "Moved user account to trash" });
    return successResponse({ id }, "User moved to trash");
  } catch {
    return internalServerErrorResponse("Failed to delete user");
  }
}
