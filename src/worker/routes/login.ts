// @ts-ignore
import { IRequest } from 'itty-router';
import { Env } from '../types';

export async function login(request: IRequest, env: Env): Promise<Response> {
    try {
        const { token } = await request.json() as { token: string };

        if (!token) {
            return new Response(JSON.stringify({ error: 'Token required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (token === env.ADMIN_TOKEN) {
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
