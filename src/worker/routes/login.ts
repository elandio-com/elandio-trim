import { Env } from '../types';
import { isAdminTokenConfigured, timingSafeEqual } from '../utils/auth';

/**
 * Validates an admin token so the dashboard can show a login error instead of
 * silently failing on the first API call.
 *
 * This establishes no session and sets no cookie: the token itself is the
 * credential on every subsequent request. The endpoint is therefore a token
 * oracle by design, and its only real protection is the API rate limit plus a
 * token long enough to resist guessing — hence the strength guidance in the
 * README. See the "Security Model" section there.
 */
export async function login(request: Request, env: Env): Promise<Response> {
    if (!isAdminTokenConfigured(env)) {
        console.error('[Login] ADMIN_TOKEN is not configured');
        return json({ error: 'Server configuration error' }, 500);
    }

    let token: string;
    try {
        ({ token } = (await request.json()) as { token: string });
    } catch {
        return json({ error: 'Invalid request' }, 400);
    }

    if (!token) {
        return json({ error: 'Token required' }, 400);
    }

    if (!timingSafeEqual(token, env.ADMIN_TOKEN)) {
        console.warn('[Login] Failed authentication attempt');
        return json({ error: 'Invalid token' }, 401);
    }

    return json({ success: true }, 200);
}

function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
        },
    });
}
