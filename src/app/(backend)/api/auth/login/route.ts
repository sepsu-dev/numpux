import { NextResponse } from "next/server";
import { createSession, encrypt } from "@/lib/session";
import { initDb } from "@/lib/db";
import { findUserByEmail, hashPassword } from "@/lib/user-db";

export async function POST(request: Request) {
  try {
    await initDb();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const hashedInput = hashPassword(password);
    if (user.password_hash !== hashedInput) {
      return NextResponse.json(
        { status: "error", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await encrypt({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      status: "success",
      message: "Signed in successfully",
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to process login" },
      { status: 500 }
    );
  }
}
