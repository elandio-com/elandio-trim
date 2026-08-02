/**
 * Best-effort in-memory rate limiting.
 *
 * Workers state is per-isolate and ephemeral, so this is a speed bump, not a
 * guarantee: an attacker spread across isolates gets a fresh budget in each one.
 * It is worth keeping because it costs nothing and blunts the common single-source
 * case, but anything load-bearing belongs in Cloudflare WAF rate limiting rules.
 * See README "Rate Limits".
 */

interface Bucket {
    windowStart: number;
    count: number;
}

export interface RateLimitRule {
    windowMs: number;
    maxRequests: number;
}

/** Admin/API surface: protects the token-guessing path. */
export const API_RATE_LIMIT: RateLimitRule = { windowMs: 1_000, maxRequests: 5 };

/**
 * Redirects. Previously unlimited, which mattered because every redirect performs
 * a D1 *write* to count the click — the free tier allows 5M writes/month, so an
 * unthrottled loop over one link could burn the operator's quota. Generous enough
 * that real traffic (including a link going viral) is unaffected.
 */
export const REDIRECT_RATE_LIMIT: RateLimitRule = { windowMs: 1_000, maxRequests: 20 };

/** One setup attempt per minute; setup is unauthenticated before first run. */
export const SETUP_RATE_LIMIT: RateLimitRule = { windowMs: 60_000, maxRequests: 1 };

/**
 * Cap on tracked keys. Without this the map grows for the life of the isolate,
 * one entry per distinct client IP — a slow leak that a spray of spoofed-looking
 * sources could accelerate. On overflow we evict expired entries first and, if
 * that is not enough, clear the map entirely: losing rate-limit state is a far
 * better failure than unbounded growth.
 */
const MAX_TRACKED_KEYS = 10_000;

const buckets = new Map<string, Bucket>();

export function clientKey(request: Request): string {
    return request.headers.get('CF-Connecting-IP') || 'unknown';
}

/** Returns true when the request is allowed, false when it should be rejected. */
export function checkRateLimit(key: string, rule: RateLimitRule, namespace: string): boolean {
    const now = Date.now();
    const mapKey = `${namespace}:${key}`;
    const bucket = buckets.get(mapKey);

    if (!bucket || now - bucket.windowStart >= rule.windowMs) {
        if (buckets.size >= MAX_TRACKED_KEYS) evict(now);
        buckets.set(mapKey, { windowStart: now, count: 1 });
        return true;
    }

    if (bucket.count >= rule.maxRequests) return false;

    bucket.count += 1;
    return true;
}

function evict(now: number): void {
    for (const [key, bucket] of buckets) {
        // Any window older than the longest rule can never be relevant again.
        if (now - bucket.windowStart >= SETUP_RATE_LIMIT.windowMs) {
            buckets.delete(key);
        }
    }
    if (buckets.size >= MAX_TRACKED_KEYS) {
        buckets.clear();
    }
}

export function tooManyRequests(retryAfterSeconds: number): Response {
    return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
            'Retry-After': String(retryAfterSeconds),
            'Cache-Control': 'no-store',
        },
    });
}
