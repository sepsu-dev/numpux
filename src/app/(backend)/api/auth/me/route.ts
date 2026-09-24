import { deleteSession } from "@/lib/session";
import { validateAdminAuth } from "@/lib/api-auth";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/response";
import { hashPassword } from "@/lib/user-db";
import { updateProfileSchema } from "./schema";
import {
  findUserWithPassword,
  updateUserProfileQuery,
  updateUserPasswordQuery,
} from "./query";

export async function POST() {
  await deleteSession();
  return successResponse(null, "Signed out successfully");
}

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  return successResponse(auth.user);
}

export async function PUT(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid input data",
        parsed.error.flatten().fieldErrors
      );
    }

    const { name, currentPassword, newPassword } = parsed.data;

    if (!auth.user) {
      return unauthorizedResponse("Unauthorized user session.");
    }

    const { user } = auth;

    // If changing password
    if (newPassword) {
      if (!currentPassword) {
        return badRequestResponse("Current password is required to set a new password.");
      }

      const existingUser = await findUserWithPassword(user.email);
      if (!existingUser || existingUser.password_hash !== hashPassword(currentPassword)) {
        return badRequestResponse("Current password is incorrect.");
      }

      await updateUserPasswordQuery(user.userId, newPassword);
    }

    let updatedUser: { userId: string; email: string; name: string } = { ...user };
    if (name && name.trim()) {
      const res = await updateUserProfileQuery(user.userId, name.trim());
      if (res) {
        updatedUser = {
          userId: res.id,
          email: res.email,
          name: res.name,
        };
      }
    }

    return successResponse(updatedUser, "Profile updated successfully.");
  } catch (err: any) {
    console.error("PUT /api/auth/me error:", err);
    return internalServerErrorResponse(err?.message || "Failed to update profile.");
  }
}
