import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirectUri = `${origin}/api/auth/google/callback`;
  const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    // If Google Client ID is not configured yet, redirect with helpful notification message
    return NextResponse.redirect(
      new URL(
        "/login?error=Google+OAuth+credentials+not+configured.+Please+set+AUTH_GOOGLE_ID+and+AUTH_GOOGLE_SECRET+in+.env.local",
        origin
      )
    );
  }

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(googleAuthUrl.toString());
}
