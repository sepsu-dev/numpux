import { NextResponse } from "next/server";
import { initDb } from "@/db";
import { findOrCreateOAuthUser, getUserSessionVersion, markUserLogin } from "@/lib/user-db";
import { createSession } from "@/lib/session";
import { cookies } from "next/headers";
import { isValidOAuthState, OAUTH_STATE_COOKIE } from "@/lib/oauth-state";
import { getOAuthConfig } from "@/lib/env";
import { z } from "zod";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USER_INFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const googleTokenSchema = z.object({ access_token: z.string().min(1) });
const googleUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oauth = getOAuthConfig();
  if (!oauth) return NextResponse.json({ error: "Google OAuth is not configured" }, { status: 503 });
  const loginUrl = new URL("/login", oauth.appUrl);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (error || !code || !isValidOAuthState(state, expectedState)) {
    loginUrl.searchParams.set("error", error || (!code ? "Google authentication was cancelled" : "Invalid OAuth state"));
    return NextResponse.redirect(loginUrl);
  }

  const redirectUri = new URL("/api/auth/google/callback", oauth.appUrl).toString();

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: oauth.clientId,
        client_secret: oauth.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.text();
      console.error("Failed to exchange Google token:", errData);
      loginUrl.searchParams.set("error", "Failed to exchange Google authorization token");
      return NextResponse.redirect(loginUrl);
    }

    const tokenData = googleTokenSchema.parse(await tokenResponse.json());

    // 2. Fetch user information from Google UserInfo endpoint
    const userInfoResponse = await fetch(GOOGLE_USER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      loginUrl.searchParams.set("error", "Failed to fetch user profile from Google");
      return NextResponse.redirect(loginUrl);
    }

    const googleUser = googleUserSchema.parse(await userInfoResponse.json());

    // 3. Sync or create user in PostgreSQL
    await initDb();
    const user = await findOrCreateOAuthUser(
      googleUser.name || googleUser.email.split("@")[0],
      googleUser.email
    );
    const { pool } = await import("@/db");
    await pool.query("UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = $1", [user.id]);
    await markUserLogin(user.id);
    const sessionVersion = await getUserSessionVersion(user.id);

    // 4. Establish Numpux session cookie
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
      sessionVersion,
    });

    // 5. Redirect successfully to dashboard
    return NextResponse.redirect(new URL("/dashboard", oauth.appUrl));
  } catch (err) {
    console.error("Google OAuth error:", err);
    loginUrl.searchParams.set("error", "An unexpected error occurred during Google sign in");
    return NextResponse.redirect(loginUrl);
  }
}
