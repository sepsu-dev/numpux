import { randomBytes, timingSafeEqual } from "crypto";

export const OAUTH_STATE_COOKIE = "oauth_state";

export function createOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function isValidOAuthState(received: string | null, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}