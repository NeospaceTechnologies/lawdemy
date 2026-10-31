import "server-only";

// Fixed-window in-memory limiter. Good for a single instance; move to Redis
// (or the database) before running more than one server.
// On globalThis so every route handler shares one store (Next.js may load modules per route).
type Hit = { count: number; resetAt: number };
const g = globalThis as unknown as { __lawdemyRateLimit?: Map<string, Hit> };
const hits = (g.__lawdemyRateLimit ??= new Map<string, Hit>());

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (entry.count >= limit) return { ok: false, retryAfterMs: entry.resetAt - now };
  entry.count += 1;
  return { ok: true, retryAfterMs: 0 };
}
