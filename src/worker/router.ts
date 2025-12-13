import { IRequest } from 'itty-router';
import { createLink } from './routes/create';
import { handleRedirect } from './routes/redirect';
import { listLinks, deleteLink, updateLink } from './routes/admin';
import { healthCheck } from './routes/health';
import { getSettings, updateSettings } from './routes/settings';
import { setupDatabase } from './routes/setup';
import { login } from './routes/login';
import { Env } from './types';

export const router = {
    async handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        console.log(`[Router] ${method} ${path}`);

        // Check database for settings (only fallback_url now)
        // Check database for settings (safely)
        try {
            const { D1Adapter } = await import('../../adapters/d1Adapter');
            const db = new D1Adapter(env.DB);
            const dbFallbackUrl = await db.getSetting('fallback_url');
            if (dbFallbackUrl) {
                // @ts-ignore
                env.FALLBACK_URL = dbFallbackUrl;
            }
        } catch (e) {
            console.warn('[Router] Failed to load settings from DB (ignoring):', e);
        }

        if (method === 'GET' && path === '/api/health') {
            // @ts-ignore
            return healthCheck(request, env);
        }

        if (method === 'POST' && path === '/api/setup') {
            // @ts-ignore
            return setupDatabase(request, env);
        }

        if (method === 'POST' && path === '/api/admin/login') {
            // @ts-ignore
            return login(request, env);
        }

        if (method === 'POST' && path === '/api/admin/create') {
            return createLink(request as IRequest, env);
        }

        if (method === 'GET' && path === '/api/admin/list') {
            return listLinks(request as IRequest, env);
        }

        if (method === 'GET' && path === '/api/admin/settings') {
            // @ts-ignore
            return getSettings(request, env);
        }

        if (method === 'PUT' && path === '/api/admin/settings') {
            // @ts-ignore
            return updateSettings(request, env);
        }

        if (method === 'DELETE' && path.startsWith('/api/admin/')) {
            const slug = path.split('/api/admin/')[1];
            if (slug) {
                // @ts-ignore
                request.params = { slug };
                // @ts-ignore
                return deleteLink(request, env);
            }
        }

        if (method === 'PUT' && path.startsWith('/api/admin/')) {
            const slug = path.split('/api/admin/')[1];
            if (slug) {
                // @ts-ignore
                request.params = { slug };
                // @ts-ignore
                return updateLink(request, env);
            }
        }

        // Handle redirects - Strict Root Path Mode
        if (method === 'GET') {
            let slug = null;
            const reserved = ['api', 'dashboard.html', 'dashboard.js', 'styles.css', 'favicon.ico', 'assets'];

            // Allow basic root slugs
            const pathSlug = path.substring(1); // Remove leading /

            if (pathSlug && !reserved.includes(pathSlug) && !pathSlug.startsWith('api/')) {
                slug = pathSlug;
            }

            if (slug) {
                // @ts-ignore
                request.params = { slug };
                // @ts-ignore
                return handleRedirect(request, env);
            }
        }

        // Asset fallback for static files
        if (method === 'GET') {
            try {
                return await env.ASSETS.fetch(request);
            } catch (e) {
                // ignore
            }
        }

        // 404 handling - redirect to fallback URL if configured, otherwise show 404 page
        if (env.FALLBACK_URL) {
            console.log(`[Router] 404 - Redirecting to fallback: ${env.FALLBACK_URL}`);
            return Response.redirect(env.FALLBACK_URL, 302);
        }

        // Try to serve custom 404 page
        try {
            const notFoundRequest = new Request(new URL('/404.html', request.url), request);
            const notFoundResponse = await env.ASSETS.fetch(notFoundRequest);
            return new Response(notFoundResponse.body, {
                status: 404,
                headers: notFoundResponse.headers
            });
        } catch (e) {
            // Fallback to simple text response
            return new Response('Not Found', { status: 404 });
        }
    }
};
