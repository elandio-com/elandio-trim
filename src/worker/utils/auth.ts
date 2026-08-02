import { Env } from '../types';

/**
 * Constant-time string comparison.
 *
 * The previous code compared tokens with `===` under a comment claiming the
 * comparison was constant-time. `===` short-circuits on the first differing
 * byte, so response timing leaks a prefix-match length. That is a narrow channel
 * over the public internet, but it is real, and the fix is cheap.
 *
 * Length is compared separately and unavoidably leaks — that is standard and not
 * considered sensitive for a token of unknown length.
 */
export function timingSafeEqual(a: string, b: string): boolean {
    const aBytes = new TextEncoder().encode(a);
    const bBytes = new TextEncoder().encode(b);

    if (aBytes.length !== bBytes.length) return false;

    let diff = 0;
    for (let i = 0; i < aBytes.length; i++) {
        diff |= aBytes[i] ^ bBytes[i];
    }
    return diff === 0;
}

/** Reads the admin token from either supported header, preferring `Authorization: Bearer`. */
export function extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
        const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
        if (match) return match[1];
    }
    return request.headers.get('x-admin-token');
}

/** True when the request carries the configured admin token. */
export function isAuthorized(request: Request, env: Env): boolean {
    if (!isAdminTokenConfigured(env)) {
        console.error('[Auth] ADMIN_TOKEN is not configured');
        return false;
    }

    const token = extractToken(request);
    if (!token) return false;

    return timingSafeEqual(token, env.ADMIN_TOKEN);
}

export function isAdminTokenConfigured(env: Env): boolean {
    return typeof env.ADMIN_TOKEN === 'string' && env.ADMIN_TOKEN.trim().length > 0;
}

export function unauthorized(): Response {
    return new Response('Unauthorized', { status: 401 });
}

export function misconfigured(): Response {
    return new Response('Server configuration error', { status: 500 });
}
