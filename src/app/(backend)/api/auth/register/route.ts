import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { initDb } from "@/lib/db";
import { findUserByEmail, createUser } from "@/lib/user-db";

export async function POST(request: Request) {
  try {
    await initDb();
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { status: "error", message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { status: "error", message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { status: "error", message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const newUser = await createUser(name.trim(), email.trim().toLowerCase(), password);

    await createSession({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Account registered successfully",
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to process registration" },
      { status: 500 }
    );
  }
}
