import { createSession } from "@/lib/session";
import { initDb } from "@/db";
import { badRequestResponse, conflictResponse, internalServerErrorResponse, successResponse } from "@/lib/response";
import { registerSchema } from "./schema";
import { findUserByEmailQuery, createNewUser } from "./query";

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid input data",
        parsed.error.flatten().fieldErrors
      );
    }

    const { name, email, password } = parsed.data;
    const existingUser = await findUserByEmailQuery(email);
    if (existingUser) {
      return conflictResponse("An account with this email already exists");
    }

    const newUser = await createNewUser(name.trim(), email.trim().toLowerCase(), password);

    await createSession({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role || "user",
    });

    return successResponse(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || "user",
      },
      "Account registered successfully",
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return internalServerErrorResponse("Failed to process registration");
  }
}
