import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Dynamic resolver to read environment variables at runtime
export function getValidPublicKeys(): Set<string> {
  const publicKey = process.env.PUBLIC_API_KEY || process.env.NEXT_PUBLIC_API_KEY || "pk_live_numpux_public_key_01";
  return new Set([publicKey]);
}

// Deprecated alias for backward-compatibility
export const getAdminPublicKeys = getValidPublicKeys;

const getSecretKey = () => process.env.JWT_SECRET || process.env.SESSION_SECRET || "numpux-dev-secret-change-me";
const getEncodedKey = () => new TextEncoder().encode(getSecretKey());

export type AuthResult =
  | {
      isValid: true;
      user: {
        userId: string;
        email: string;
        name: string;
        role?: "admin" | "user";
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
 * Validates public key from header (X-Public-Key) or query parameter (?public_key=...)
 */
export function validatePublicKey(request: Request | NextRequest): { isValid: boolean; key?: string } {
  const headers = request.headers;
  const keyFromHeader = headers.get("x-public-key") || headers.get("X-Public-Key");

  let keyFromQuery: string | null = null;
  if ("nextUrl" in request) {
    keyFromQuery = (request as NextRequest).nextUrl.searchParams.get("public_key");
  } else {
    try {
      const url = new URL(request.url);
      keyFromQuery = url.searchParams.get("public_key");
    } catch {
      keyFromQuery = null;
    }
  }

  const validPublicKeys = getValidPublicKeys();
  const key = keyFromHeader || keyFromQuery;
  if (!key || !validPublicKeys.has(key)) {
    return { isValid: false };
  }
  return { isValid: true, key };
}

/**
 * Helper to optionally extract authenticated user from Authorization header or cookie
 */
export async function getOptionalAuthUser(request: Request | NextRequest): Promise<{ userId: string; email: string; name: string; role?: "admin" | "user" } | null> {
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
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });

    return {
      userId: String(payload.userId || ""),
      email: String(payload.email || ""),
      name: String(payload.name || ""),
      role: (payload.role as "admin" | "user") || "user",
    };
  } catch {
    return null;
  }
}

/**
 * Validates authenticated access requiring:
 * 1. An authorized Public Key in X-Public-Key
 * 2. A valid JWT in Authorization: Bearer <jwt> or cookie session
 */
export async function validateAdminAuth(request: Request | NextRequest): Promise<AuthResult> {
  const headers = request.headers;
  const key = headers.get("x-public-key") || headers.get("X-Public-Key");
  const validKeys = getValidPublicKeys();

  if (!key || !validKeys.has(key)) {
    return {
      isValid: false,
      error: "Missing or invalid Public Key. Expected authorized X-Public-Key header.",
      statusCode: 401,
    };
  }

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
