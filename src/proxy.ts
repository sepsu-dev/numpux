import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getEncodedSessionSecret } from "@/lib/session-secret";

const encodedKey = getEncodedSessionSecret();

const PROTECTED_PREFIXES = ["/dashboard", "/tasks", "/projects", "/workspace", "/master", "/monitoring", "/reports", "/notifications", "/profile"];
const PUBLIC_PATHS = ["/login", "/register"];

async function getValidSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, { algorithms: ["HS256"] });
    return payload.userId ? payload : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const session = await getValidSession(request);
  const loggedIn = Boolean(session);

  if (isProtected && !loggedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublic && loggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (loggedIn) {
    const role = String(session?.role || "user");
    const requiresOwner = pathname === "/master"
      || pathname.startsWith("/master/")
      || pathname.startsWith("/monitoring");
    if (requiresOwner && role !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/projects/:path*",
    "/workspace/:path*",
    "/master/:path*",
    "/monitoring/:path*",
    "/reports/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
