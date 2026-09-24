import { NextResponse } from "next/server";
import { createSession, encrypt } from "@/lib/session";
import { initDb } from "@/db";
import { hashPassword } from "@/lib/user-db";
import { badRequestResponse, internalServerErrorResponse, unauthorizedResponse } from "@/lib/response";
import { loginSchema } from "./schema";
import { findUserForLogin } from "./query";

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid input data",
        parsed.error.flatten().fieldErrors
      );
    }

    const { email, password } = parsed.data;
    const user = await findUserForLogin(email.trim().toLowerCase());
    if (!user) {
      return unauthorizedResponse("Invalid email or password");
    }

    const hashedInput = hashPassword(password);
    if (user.password_hash !== hashedInput) {
      return unauthorizedResponse("Invalid email or password");
    }

    const token = await encrypt({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
    });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
    });

    return NextResponse.json({
      status: "success",
      message: "Signed in successfully",
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return internalServerErrorResponse("Failed to process login");
  }
}
