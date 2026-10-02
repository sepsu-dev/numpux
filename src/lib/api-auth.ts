import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getEncodedSessionSecret } from "@/lib/session-secret";
import { pool } from "@/db";

export type AuthResult =
  | {
      isValid: true;
      user: {
        userId: string;
        email: string;
        name: string;
        role?: "superadmin" | "admin" | "user";
      };
      error?: undefined;
      statusCode?: undefined;
    }
  | {
      isValid: false;
      error: string;
      statusCode?: number;
      user?: undefined;
    };

/**
 * Helper to optionally extract authenticated user from Authorization header or cookie
 */
export async function getOptionalAuthUser(request: Request | NextRequest): Promise<{ userId: string; email: string; name: string; role?: "superadmin" | "admin" | "user" } | null> {
  const headers = request.headers;
  const authHeader = headers.get("authorization") || headers.get("Authorization");
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    if ("cookies" in request) {
      token = (request as NextRequest).cookies.get("session")?.value;
    }
    if (!token) {
      const cookieHeader = headers.get("cookie") || "";
      const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getEncodedSessionSecret(), {
      algorithms: ["HS256"],
    });

    const userId = String(payload.userId || "");
    if (!userId) return null;
    const account = await pool.query(
      "SELECT name, email, role, account_status, session_version FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1",
      [userId]
    );
    if (!account.rows.length || account.rows[0].account_status === "suspended") return null;
    if (Number(payload.sessionVersion || 1) !== Number(account.rows[0].session_version || 1)) return null;
    return {
      userId,
      email: String(account.rows[0].email || ""),
      name: String(account.rows[0].name || ""),
      role: (account.rows[0].role as "superadmin" | "admin" | "user") || "user",
    };
  } catch {
    return null;
  }
}

/**
 * Validates authenticated access using a JWT bearer token or session cookie.
 */
export async function validateAdminAuth(request: Request | NextRequest): Promise<AuthResult> {
  const user = await getOptionalAuthUser(request);
  if (!user) {
    return {
      isValid: false,
      error: "Missing or invalid JWT session token.",
      statusCode: 401,
    };
  }

  return {
    isValid: true,
    user,
  };
}
