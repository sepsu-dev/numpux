import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { findOrCreateOAuthUser } from "@/lib/user-db";
import { createSession } from "@/lib/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error || "Google authentication was cancelled")}`, origin)
    );
  }

  const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/login?error=Google+OAuth+credentials+are+missing+on+server", origin)
    );
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.text();
      console.error("Failed to exchange Google token:", errData);
      return NextResponse.redirect(
        new URL("/login?error=Failed+to+exchange+Google+authorization+token", origin)
      );
    }

    const tokenData = await tokenResponse.json();

    // 2. Fetch user information from Google UserInfo endpoint
    const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        new URL("/login?error=Failed+to+fetch+user+profile+from+Google", origin)
      );
    }

    const googleUser = (await userInfoResponse.json()) as {
      email?: string;
      name?: string;
      picture?: string;
      sub?: string;
    };

    if (!googleUser.email) {
      return NextResponse.redirect(
        new URL("/login?error=Google+account+did+not+provide+an+email+address", origin)
      );
    }

    // 3. Sync or create user in PostgreSQL
    await initDb();
    const user = await findOrCreateOAuthUser(
      googleUser.name || googleUser.email.split("@")[0],
      googleUser.email
    );

    // 4. Establish Numpux session cookie
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // 5. Redirect successfully to dashboard
    return NextResponse.redirect(new URL("/dashboard", origin));
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(
      new URL("/login?error=An+unexpected+error+occurred+during+Google+sign+in", origin)
    );
  }
}
