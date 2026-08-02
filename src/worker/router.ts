import { createLink } from './routes/create';
import { handleRedirect } from './routes/redirect';
import { listLinks, deleteLink, updateLink } from './routes/admin';
import { healthCheck } from './routes/health';
import { getSettings, updateSettings } from './routes/settings';
import { setupDatabase } from './routes/setup';
import { login } from './routes/login';
import { D1Adapter } from '../../adapters/d1Adapter';
import { isReservedSlug, isSlugShaped } from './utils/slug';
import { Env } from './types';

export async function handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // --- API routes -------------------------------------------------------

    if (path === '/api/health') {
        if (method !== 'GET') return methodNotAllowed('GET');
        return healthCheck(env);
    }

    if (path === '/api/setup') {
        if (method !== 'POST') return methodNotAllowed('POST');
        return setupDatabase(request, env);
    }

    if (path === '/api/admin/login') {
        if (method !== 'POST') return methodNotAllowed('POST');
        return login(request, env);
    }

    if (path === '/api/admin/create') {
        if (method !== 'POST') return methodNotAllowed('POST');
        return createLink(request, env);
    }

    if (path === '/api/admin/list') {
        if (method !== 'GET') return methodNotAllowed('GET');
        return listLinks(request, env);
    }

    if (path === '/api/admin/settings') {
        if (method === 'GET') return getSettings(request, env);
        if (method === 'PUT') return updateSettings(request, env);
        return methodNotAllowed('GET, PUT');
    }

    // /api/admin/:slug — must come after the fixed /api/admin/* routes above so
    // that `list`, `create`, `login` and `settings` are never treated as slugs.
    if (path.startsWith('/api/admin/')) {
        const slug = decodeURIComponent(path.slice('/api/admin/'.length));
        if (slug && !slug.includes('/')) {
            if (method === 'DELETE') return deleteLink(request, env, slug);
            if (method === 'PUT') return updateLink(request, env, slug);
            return methodNotAllowed('DELETE, PUT');
        }
    }

    if (path.startsWith('/api/')) {
        return json({ error: 'Not found' }, 404);
    }

    // --- Short links and static assets ------------------------------------

    if (method === 'GET' || method === 'HEAD') {
        const candidate = path.slice(1);

        // Only a bare, slug-shaped segment can be a link. Anything containing a
        // dot or a slash (/styles.css, /vendor/tailwind.js, /fonts/x.woff2) falls
        // through to the asset handler, so static files can never be shadowed.
        if (isSlugShaped(candidate) && !isReservedSlug(candidate)) {
            const redirect = await handleRedirect(env, ctx, candidate);
            if (redirect) return redirect;
        }

        const asset = await env.ASSETS.fetch(request);
        if (asset.status !== 404) return asset;
    }

    return notFound(request, env);
}

/**
 * Unknown path: redirect to the operator's fallback URL if one is configured,
 * otherwise serve the 404 page.
 *
 * The fallback is read here rather than at the top of every request. Previously
 * this query ran on *every* request — including each redirect and every static
 * asset — which doubled D1 reads on the hottest path for a value only needed on
 * a miss.
 */
async function notFound(request: Request, env: Env): Promise<Response> {
    const fallbackUrl = await resolveFallbackUrl(env);
    if (fallbackUrl) {
        return Response.redirect(fallbackUrl, 302);
    }

    try {
        const notFoundRequest = new Request(new URL('/404.html', request.url), {
            method: 'GET',
            headers: request.headers,
        });
        const response = await env.ASSETS.fetch(notFoundRequest);
        return new Response(response.body, {
            status: 404,
            headers: response.headers,
        });
    } catch {
        return new Response('Not Found', { status: 404 });
    }
}

export async function resolveFallbackUrl(env: Env): Promise<string | null> {
    try {
        const stored = await new D1Adapter(env.DB).getSetting('fallback_url');
        if (stored) return stored;
    } catch (e) {
        // The settings table may not exist before setup; fall back to the env var.
        console.warn('[Router] Could not read fallback_url from D1:', e);
    }
    return env.FALLBACK_URL || null;
}

function methodNotAllowed(allow: string): Response {
    return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: allow },
    });
}

function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export const router = { handle };
