const DEVELOPMENT_SECRET = "numpux-local-development-secret";

export function getSessionSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET or SESSION_SECRET must be configured in production.");
  }

  return DEVELOPMENT_SECRET;
}

export function getEncodedSessionSecret(): Uint8Array {
  return new TextEncoder().encode(getSessionSecret());
}
