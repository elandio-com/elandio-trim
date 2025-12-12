// @ts-ignore
import { IRequest } from 'itty-router';
import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';

export async function handleRedirect(request: IRequest, env: Env): Promise<Response> {
    const { params } = request;
    const slug = params.slug;

    if (!slug) {
        return new Response('Slug required', { status: 400 });
    }

    // DB Init
    const db = new D1Adapter(env.DB);

    const link = await db.getLink(slug);

    if (!link) {
        // Check database settings first, then environment variable
        const fallbackUrl = await db.getSetting('fallback_url') || env.FALLBACK_URL;

        if (fallbackUrl) {
            console.log(`[Redirect] Slug not found, redirecting to fallback: ${fallbackUrl}`);
            return Response.redirect(fallbackUrl, 302);
        }
        return new Response('Link not found', { status: 404 });
    }

    // Increment clicks (fire and forget / async)
    // In a real worker, use ctx.waitUntil(db.incrementClicks(slug))
    // But routing here doesn't pass ctx easily unless we thread it.
    // We'll await it for safety in this simple version or just let it float.
    // Better: await it to ensure consistency if it's fast.
    try {
        await db.incrementClicks(slug);
    } catch (e) {
        console.error('Failed to increment clicks', e);
    }

    return Response.redirect(link.target_url, 302);
}
