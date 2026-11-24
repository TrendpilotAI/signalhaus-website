import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  success: boolean;
  /** Epoch milliseconds when the window resets. */
  reset: number;
}

export interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>;
}

type Env = Readonly<Record<string, string | undefined>>;

interface Entry {
  count: number;
  resetAt: number;
}

// Module-level so the count survives between requests on the same instance.
const memoryStore = new Map<string, Entry>();

export function resetInMemoryRateLimit(): void {
  memoryStore.clear();
}

function pruneExpired(now: number): void {
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetAt) memoryStore.delete(key);
  }
}

/** Fallback for local dev and previews. Each serverless instance keeps its own count. */
export const inMemoryRateLimiter: RateLimiter = {
  async limit(key) {
    const now = Date.now();
    if (memoryStore.size > MAX_TRACKED_KEYS) pruneExpired(now);

    const entry = memoryStore.get(key);
    if (!entry || now > entry.resetAt) {
      const resetAt = now + RATE_LIMIT_WINDOW_MS;
      memoryStore.set(key, { count: 1, resetAt });
      return { success: true, reset: resetAt };
    }
    if (entry.count >= RATE_LIMIT_MAX) {
      return { success: false, reset: entry.resetAt };
    }
    entry.count += 1;
    return { success: true, reset: entry.resetAt };
  },
};

let upstashLimiter: { url: string; limiter: RateLimiter } | null = null;

/** Upstash Redis when configured, otherwise the in-memory fallback. */
export function getRateLimiter(env: Env = process.env): RateLimiter {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return inMemoryRateLimiter;

  if (!upstashLimiter || upstashLimiter.url !== url) {
    upstashLimiter = {
      url,
      limiter: new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, "15 m"),
        analytics: false,
        prefix: "signalhaus_leads",
      }),
    };
  }
  return upstashLimiter.limiter;
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown"
  );
}
