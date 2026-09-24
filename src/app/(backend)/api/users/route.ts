import { initDb } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import {
  badRequestResponse,
  conflictResponse,
  errorResponse,
  internalServerErrorResponse,
  paginatedResponse,
  successResponse,
} from "@/lib/response";
import { createUserSchema, getUsersQuerySchema } from "./schema";
import { findUsers, insertUser } from "./query";
import { findUserByEmail } from "@/lib/user-db";

export async function GET(request: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const parsed = getUsersQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    });

    if (!parsed.success) {
      return badRequestResponse("Invalid query parameters", parsed.error.flatten().fieldErrors);
    }

    const { search, limit, offset } = parsed.data;
    const { users, total } = await findUsers(search, limit, offset);

    return paginatedResponse(users, { total, limit, offset });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return internalServerErrorResponse("Failed to fetch users");
  }
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  try {
    await initDb();
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid input data",
        parsed.error.flatten().fieldErrors
      );
    }

    const { name, email, password, role } = parsed.data;
    const existing = await findUserByEmail(email.trim().toLowerCase());
    if (existing) {
      return conflictResponse("A user with this email already exists");
    }

    const newUser = await insertUser(name.trim(), email.trim().toLowerCase(), password, role);

    return successResponse(newUser, "User created successfully", { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return internalServerErrorResponse("Failed to create user");
  }
}
