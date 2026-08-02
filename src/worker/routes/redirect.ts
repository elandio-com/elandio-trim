import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';

/**
 * Resolves a slug to a redirect.
 *
 * Returns `null` when the slug does not exist, letting the router decide what a
 * miss means (static asset, operator fallback URL, or the 404 page) instead of
 * duplicating that logic — which also removes a second `fallback_url` lookup
 * that used to run on every miss.
 */
export async function handleRedirect(
    env: Env,
    ctx: ExecutionContext,
    slug: string
): Promise<Response | null> {
    const db = new D1Adapter(env.DB);

    let link;
    try {
        link = await db.getLink(slug);
    } catch (e) {
        console.error('[Redirect] Lookup failed:', e);
        return null;
    }

    if (!link) return null;

    // Counting a click must not delay the redirect. waitUntil keeps the worker
    // alive for the write after the response has already been sent; awaiting it
    // here previously added a full D1 round-trip to every redirect.
    ctx.waitUntil(
        db.incrementClicks(slug).catch(e => {
            console.error('[Redirect] Failed to increment clicks:', e);
        })
    );

    return Response.redirect(link.target_url, 302);
}
