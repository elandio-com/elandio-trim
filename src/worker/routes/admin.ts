import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';
import { validateUrl } from '../utils/validateUrl';
import { isAuthorized, unauthorized } from '../utils/auth';

function getDb(env: Env) {
    return new D1Adapter(env.DB);
}

export async function listLinks(request: Request, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) return unauthorized();

    try {
        const links = await getDb(env).listLinks();
        return new Response(JSON.stringify(links), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
            },
        });
    } catch (e) {
        console.error('[Admin] Error listing links:', e);
        return new Response('Error listing links', { status: 500 });
    }
}

export async function deleteLink(request: Request, env: Env, slug: string): Promise<Response> {
    if (!isAuthorized(request, env)) return unauthorized();

    try {
        // Report whether anything was actually removed: the old version returned
        // 200 "Deleted" for slugs that never existed.
        const deleted = await getDb(env).deleteLink(slug);
        if (!deleted) return new Response('Link not found', { status: 404 });
        return new Response('Deleted', { status: 200 });
    } catch (e) {
        console.error('[Admin] Error deleting link:', e);
        return new Response('Error deleting link', { status: 500 });
    }
}

export async function updateLink(request: Request, env: Env, slug: string): Promise<Response> {
    if (!isAuthorized(request, env)) return unauthorized();

    let url: string;
    try {
        ({ url } = (await request.json()) as { url: string });
    } catch {
        return new Response('Invalid JSON body', { status: 400 });
    }

    // `env` is passed so that update applies the same rules as create. Without
    // it, http:// URLs were accepted at creation in development but rejected on
    // edit, because validateUrl fell back to production rules.
    if (!url || !validateUrl(url, env)) {
        return new Response('Invalid URL', { status: 400 });
    }

    try {
        const updated = await getDb(env).updateLink(slug, new URL(url).toString());
        if (!updated) return new Response('Link not found', { status: 404 });
        return new Response('Updated', { status: 200 });
    } catch (e) {
        console.error('[Admin] Error updating link:', e);
        return new Response('Error updating link', { status: 500 });
    }
}
