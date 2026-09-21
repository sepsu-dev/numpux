import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "numpux-dev-secret-change-me";
const encodedKey = new TextEncoder().encode(secretKey);

const PROTECTED_PREFIXES = ["/dashboard", "/tasks", "/projects"];
const PUBLIC_PATHS = ["/login", "/register"];

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get("session")?.value;
  if (!session) return false;
  try {
    await jwtVerify(session, encodedKey, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const loggedIn = await hasValidSession(request);

  if (isProtected && !loggedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublic && loggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tasks/:path*", "/projects/:path*", "/login", "/register"],
};