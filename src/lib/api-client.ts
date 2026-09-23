/**
 * Standard client-side API helper
 * Automatically injects X-Public-Key for API requests
 */

export const DEFAULT_PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY || "pk_live_numpux_public_key_01";

export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});

  // Add default public key if not explicitly set
  if (!headers.has("X-Public-Key") && !headers.has("x-public-key")) {
    headers.set("X-Public-Key", DEFAULT_PUBLIC_KEY);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
