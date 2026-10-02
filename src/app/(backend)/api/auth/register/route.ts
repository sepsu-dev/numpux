import { createSession } from "@/lib/session";
import { initDb } from "@/db";
import { badRequestResponse, conflictResponse, internalServerErrorResponse, successResponse } from "@/lib/response";
import { registerSchema } from "./schema";
import { findUserByEmailQuery, createNewUser } from "./query";
import { getUserSessionVersion, markUserLogin } from "@/lib/user-db";
import { checkRateLimit, getRequestFingerprint } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(getRequestFingerprint(request, "register"), 5, 60 * 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ status: "error", message: `Too many registration attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
    }
    await initDb();
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid input data",
        parsed.error.flatten().fieldErrors
      );
    }

    const { name, email, password, invitationToken } = parsed.data;
    const existingUser = await findUserByEmailQuery(email);
    if (existingUser) {
      return conflictResponse("An account with this email already exists");
    }

    let invitation = null;
    if (invitationToken) {
      const { findInvitationByToken } = await import("@/lib/invitations");
      invitation = await findInvitationByToken(invitationToken);
      if (!invitation || invitation.status !== "pending" || new Date(invitation.expiresAt).getTime() <= Date.now()) return badRequestResponse("This invitation is invalid or has expired");
      if (invitation.email.toLowerCase() !== email.trim().toLowerCase()) return badRequestResponse("Use the email address that received this invitation");
    }
    const newUser = invitationToken
      ? (await (await import("@/lib/invitations")).registerInvitedUser({ token: invitationToken, name, email, password })).user
      : await createNewUser(name.trim(), email.trim().toLowerCase(), password, "user");
    if (!invitationToken) await markUserLogin(newUser.id);
    const sessionVersion = await getUserSessionVersion(newUser.id);

    await createSession({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role || "user",
      sessionVersion,
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
