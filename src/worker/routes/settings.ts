// @ts-ignore
import { IRequest } from 'itty-router';
import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';

// Auth helper (SECURITY: removed query parameter token support to prevent token leakage)
const isAuthorized = (request: IRequest, env: Env) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.headers.get('x-admin-token');
    return token === env.ADMIN_TOKEN;
};

function getDb(env: Env) {
    return new D1Adapter(env.DB);
}

// Get all settings
export async function getSettings(request: IRequest, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const db = getDb(env);
        const settings = await db.getAllSettings();
        return new Response(JSON.stringify(settings), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[Settings] Error getting settings:', e);
        return new Response('Error getting settings: ' + e.message, { status: 500 });
    }
}

// Update settings
export async function updateSettings(request: IRequest, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const body = await request.json() as Record<string, string>;
        const db = getDb(env);

        // Whitelist of allowed setting keys (SECURITY: prevent arbitrary key injection)
        const ALLOWED_SETTINGS = ['fallback_url', 'custom_domain', 'use_root_path'];

        // Update each setting with validation
        for (const [key, value] of Object.entries(body)) {
            // Validate key is allowed
            if (!ALLOWED_SETTINGS.includes(key)) {
                return new Response(`Invalid setting key: ${key}`, { status: 400 });
            }

            // Validate fallback_url if provided
            if (key === 'fallback_url' && value) {
                // Basic URL validation to prevent open redirects
                try {
                    const url = new URL(value);
                    // Only allow http/https protocols
                    if (!['http:', 'https:'].includes(url.protocol)) {
                        return new Response('Fallback URL must use HTTP or HTTPS', { status: 400 });
                    }
                } catch (e) {
                    return new Response('Invalid fallback URL format', { status: 400 });
                }
            }

            await db.setSetting(key, value);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[Settings] Error updating settings:', e);
        return new Response('Internal server error', { status: 500 });
    }
}
