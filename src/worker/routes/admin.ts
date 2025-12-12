// @ts-ignore
import { IRequest } from 'itty-router';
import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';
import { validateUrl } from '../utils/validateUrl';

// Auth helper (SECURITY: removed query parameter token support to prevent token leakage)
const isAuthorized = (request: IRequest, env: Env) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.headers.get('x-admin-token');
    return token === env.ADMIN_TOKEN;
};

function getDb(env: Env) {
    return new D1Adapter(env.DB);
}

export async function listLinks(request: IRequest, env: Env): Promise<Response> {
    console.log('[Admin] List links request');
    if (!isAuthorized(request, env)) {
        console.warn('[Admin] Unauthorized list request');
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const db = getDb(env);
        console.log('[Admin] Fetching from DB...');
        if (!env.DB) {
            console.error('[Admin] env.DB is undefined!');
            throw new Error('Database binding missing');
        }

        console.log('[Admin] Fetching from DB...');
        const links = await db.listLinks();
        console.log(`[Admin] Fetched ${links.length} links`);
        return new Response(JSON.stringify(links), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[Admin] Error listing links:', e);
        return new Response('Error listing links: ' + e.message, { status: 500 });
    }
}

export async function deleteLink(request: IRequest, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) return new Response('Unauthorized', { status: 401 });

    const { params } = request;
    const db = getDb(env);
    await db.deleteLink(params.slug);
    return new Response('Deleted', { status: 200 });
}

export async function updateLink(request: IRequest, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) return new Response('Unauthorized', { status: 401 });

    const { params } = request;
    const { url } = await request.json() as { url: string };

    if (!url || !validateUrl(url)) {
        return new Response('Invalid URL', { status: 400 });
    }

    const db = getDb(env);
    await db.updateLink(params.slug, url);
    return new Response('Updated', { status: 200 });
}
