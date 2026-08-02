import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';
import { isAuthorized, unauthorized } from '../utils/auth';

/** Only these keys may be written, so a request cannot inject arbitrary settings rows. */
const ALLOWED_SETTINGS = new Set(['fallback_url', 'custom_domain', 'use_root_path']);

export async function getSettings(request: Request, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) return unauthorized();

    try {
        const settings = await new D1Adapter(env.DB).getAllSettings();
        return json(settings, 200);
    } catch (e) {
        console.error('[Settings] Error getting settings:', e);
        return new Response('Error getting settings', { status: 500 });
    }
}

export async function updateSettings(request: Request, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) return unauthorized();

    let body: Record<string, string>;
    try {
        body = (await request.json()) as Record<string, string>;
    } catch {
        return new Response('Invalid JSON body', { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return new Response('Expected a JSON object', { status: 400 });
    }

    const entries = Object.entries(body);

    // Validate everything before writing anything. The old version validated and
    // wrote key by key, so a request with a valid key followed by an invalid one
    // returned 400 having already committed the first write.
    for (const [key, value] of entries) {
        if (!ALLOWED_SETTINGS.has(key)) {
            return new Response(`Invalid setting key: ${key}`, { status: 400 });
        }
        if (typeof value !== 'string') {
            return new Response(`Setting ${key} must be a string`, { status: 400 });
        }
        if (key === 'fallback_url' && value) {
            const problem = validateFallbackUrl(value);
            if (problem) return new Response(problem, { status: 400 });
        }
    }

    try {
        const db = new D1Adapter(env.DB);
        for (const [key, value] of entries) {
            await db.setSetting(key, value);
        }
        return json({ success: true }, 200);
    } catch (e) {
        console.error('[Settings] Error updating settings:', e);
        return new Response('Error updating settings', { status: 500 });
    }
}

/**
 * The fallback URL becomes an unconditional redirect target for every unknown
 * path, so it must not be able to carry a javascript:/data: payload.
 */
function validateFallbackUrl(value: string): string | null {
    if (/[<>"'\x00-\x1F\x7F]/.test(value)) {
        return 'Fallback URL contains invalid characters';
    }
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return 'Invalid fallback URL format';
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return 'Fallback URL must use HTTP or HTTPS';
    }
    return null;
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
