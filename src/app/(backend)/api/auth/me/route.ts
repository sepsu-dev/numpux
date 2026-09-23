import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";
import { validateAdminAuth } from "@/lib/api-auth";

export async function POST() {
  await deleteSession();
  return NextResponse.json({
    status: "success",
    message: "Signed out successfully",
  });
}

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json(
      { status: "error", message: auth.error },
      { status: auth.statusCode || 401 }
    );
  }

  return NextResponse.json({
    status: "success",
    data: auth.user,
  });
}

export async function PUT(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json(
      { status: "error", message: auth.error },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    const { updateUserProfile, findUserByEmail, updateUserPassword, hashPassword } = await import("@/lib/user-db");

    if (!auth.user) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized user session." },
        { status: 401 }
      );
    }

    const { user } = auth;

    // If changing password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { status: "error", message: "Current password is required to set a new password." },
          { status: 400 }
        );
      }

      const existingUser = await findUserByEmail(user.email);
      if (!existingUser || existingUser.password_hash !== hashPassword(currentPassword)) {
        return NextResponse.json(
          { status: "error", message: "Current password is incorrect." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { status: "error", message: "New password must be at least 6 characters." },
          { status: 400 }
        );
      }

      await updateUserPassword(user.userId, newPassword);
    }

    let updatedUser: { userId: string; email: string; name: string } = { ...user };
    if (name && name.trim()) {
      const res = await updateUserProfile(user.userId, name.trim());
      if (res) {
        updatedUser = {
          userId: res.id,
          email: res.email,
          name: res.name,
        };
      }
    }

    return NextResponse.json({
      status: "success",
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
