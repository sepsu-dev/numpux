import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || process.env.SESSION_SECRET || "numpux-dev-secret-change-me";
const encodedKey = new TextEncoder().encode(secretKey);

const PROTECTED_ROUTES = ["/dashboard", "/projects", "/tasks", "/master", "/profile"];
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;

  let isValidSession = false;
  if (sessionCookie) {
    try {
      await jwtVerify(sessionCookie, encodedKey, { algorithms: ["HS256"] });
      isValidSession = true;
    } catch {
      isValidSession = false;
    }
  }

  // If user is accessing protected dashboard routes without valid session
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtectedRoute && !isValidSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and tries to visit auth pages (/login, /register), redirect to /dashboard
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/master/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
