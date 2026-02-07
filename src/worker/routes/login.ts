// @ts-ignore
import { IRequest } from 'itty-router';
import { Env } from '../types';

export async function login(request: IRequest, env: Env): Promise<Response> {
    try {
        // [SECURITY] Validate ADMIN_TOKEN is configured
        if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.trim().length === 0) {
            console.error('[Login] ADMIN_TOKEN not configured');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { token } = await request.json() as { token: string };

        if (!token) {
            return new Response(JSON.stringify({ error: 'Token required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // [SECURITY] Use consistent error message to prevent token enumeration
        if (token !== env.ADMIN_TOKEN) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
