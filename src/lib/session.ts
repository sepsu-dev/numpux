import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEncodedSessionSecret } from "@/lib/session-secret";
import { pool } from "@/db";

const encodedKey = getEncodedSessionSecret();
const SESSION_COOKIE = "session";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role?: "superadmin" | "admin" | "user";
  sessionVersion?: number;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const session = await encrypt(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + SEVEN_DAYS),
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await decrypt(session);
  if (!payload?.userId) return null;
  const account = await pool.query(
    "SELECT name, email, role, account_status, session_version FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1",
    [payload.userId]
  );
  if (!account.rows.length || account.rows[0].account_status !== "active") return null;
  if (Number(payload.sessionVersion || 1) !== Number(account.rows[0].session_version || 1)) return null;
  return {
    userId: payload.userId,
    name: account.rows[0].name,
    email: account.rows[0].email,
    role: account.rows[0].role || "user",
    sessionVersion: Number(account.rows[0].session_version || 1),
  };
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
