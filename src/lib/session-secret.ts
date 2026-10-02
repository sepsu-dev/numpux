import { getSessionConfig } from "@/lib/env";

export function getSessionSecret(): string {
  return getSessionConfig().JWT_SECRET;
}

export function getEncodedSessionSecret(): Uint8Array {
  return new TextEncoder().encode(getSessionSecret());
}
