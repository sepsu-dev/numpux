import { NextResponse } from "next/server";
import { createSession, encrypt } from "@/lib/session";
import { initDb } from "@/db";
import { markUserLogin, verifyAndUpgradePassword } from "@/lib/user-db";
import { badRequestResponse, internalServerErrorResponse, unauthorizedResponse } from "@/lib/response";
import { loginSchema } from "./schema";
import { findUserForLogin } from "./query";
import { checkRateLimit, getRequestFingerprint } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(getRequestFingerprint(request, "login"), 10, 15 * 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ status: "error", message: `Too many sign-in attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
    }
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
    if (user.accountStatus !== "active") {
      return unauthorizedResponse("This account has been suspended. Contact an administrator.");
    }

    if (!(await verifyAndUpgradePassword(user.id, password, user.password_hash))) {
      return unauthorizedResponse("Invalid email or password");
    }

    await markUserLogin(user.id);

    const token = await encrypt({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
      sessionVersion: user.sessionVersion,
    });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
      sessionVersion: user.sessionVersion,
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
