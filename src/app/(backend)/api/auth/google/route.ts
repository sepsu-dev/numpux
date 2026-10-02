import { NextResponse } from "next/server";
import { createOAuthState, OAUTH_STATE_COOKIE } from "@/lib/oauth-state";
import { getOAuthConfig } from "@/lib/env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const OAUTH_STATE_TTL_SECONDS = 10 * 60;

export async function GET() {
  const oauth = getOAuthConfig();

  if (!oauth) {
    return NextResponse.json({ error: "Google OAuth is not configured" }, { status: 503 });
  }

  const redirectUri = new URL("/api/auth/google/callback", oauth.appUrl).toString();
  const googleAuthUrl = new URL(GOOGLE_AUTH_URL);
  googleAuthUrl.searchParams.set("client_id", oauth.clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");
  const state = createOAuthState();
  googleAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(googleAuthUrl.toString());
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OAUTH_STATE_TTL_SECONDS,
    path: "/",
  });
  return response;
}
