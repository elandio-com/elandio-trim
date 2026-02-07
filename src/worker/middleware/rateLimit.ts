// Simple in-memory rate limiter for demo purposes.
// In production, use Cloudflare Rate Limiting logic or KV.
const ipRequests = new Map<string, { windowStart: number; count: number }>();
const WINDOW_MS = 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

export async function rateLimit(request: Request): Promise<Response | null> {
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();

    // Clean up old entries
    // (In a real worker, this state is ephemeral anyway)

    const entry = ipRequests.get(clientIp);
    if (!entry || now - entry.windowStart >= WINDOW_MS) {
        ipRequests.set(clientIp, { windowStart: now, count: 1 });
        return null;
    }

    if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
        return new Response('Rate limit exceeded', { status: 429 });
    }

    entry.count += 1;
    ipRequests.set(clientIp, entry);
    return null; // No rate limit hit
}
