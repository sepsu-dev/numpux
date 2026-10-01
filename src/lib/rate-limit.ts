type Entry = { count: number; resetAt: number };

const globalRateLimit = globalThis as unknown as { numpuxRateLimits?: Map<string, Entry> };
const entries = globalRateLimit.numpuxRateLimits || new Map<string, Entry>();
globalRateLimit.numpuxRateLimits = entries;

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getRequestFingerprint(request: Request, namespace: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${namespace}:${forwarded || request.headers.get("x-real-ip") || "local"}`;
}
