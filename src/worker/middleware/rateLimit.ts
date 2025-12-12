// Simple in-memory rate limiter for demo purposes.
// In production, use Cloudflare Rate Limiting logic or KV.
const ipRequests = new Map<string, number>();

export async function rateLimit(request: Request): Promise<Response | null> {
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();

    // Clean up old entries
    // (In a real worker, this state is ephemeral anyway)

    const lastRequest = ipRequests.get(clientIp) || 0;
    if (now - lastRequest < 1000) { // 1 request per second
        return new Response('Rate limit exceeded', { status: 429 });
    }

    ipRequests.set(clientIp, now);
    return null; // No rate limit hit
}
