import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET || "numpux-dev-secret-change-me";
const encodedKey = new TextEncoder().encode(secretKey);
const SESSION_COOKIE = "session";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
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
  return decrypt(session);
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}