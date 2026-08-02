import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';
import { validateUrl } from '../utils/validateUrl';
import { generateSlug } from '../utils/generateSlug';
import { validateSlug, SLUG_MIN_LENGTH, SLUG_MAX_LENGTH } from '../utils/slug';
import { isAuthorized, unauthorized } from '../utils/auth';

const SLUG_GENERATION_ATTEMPTS = 5;

export async function createLink(request: Request, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) return unauthorized();

    let url: string;
    let slug: string | undefined;
    try {
        ({ url, slug } = (await request.json()) as { url: string; slug?: string });
    } catch {
        return new Response('Invalid JSON body', { status: 400 });
    }

    if (!url || !validateUrl(url, env)) {
        return new Response('Invalid URL', { status: 400 });
    }
    const normalizedUrl = new URL(url).toString();

    const db = new D1Adapter(env.DB);

    if (slug) {
        const problem = validateSlug(slug);
        if (problem === 'invalid_characters') {
            return new Response('Slug can only contain letters, numbers, hyphens, and underscores', { status: 400 });
        }
        if (problem === 'invalid_length') {
            return new Response(`Slug must be between ${SLUG_MIN_LENGTH} and ${SLUG_MAX_LENGTH} characters`, { status: 400 });
        }
        if (problem === 'reserved') {
            return new Response('Slug reserved', { status: 400 });
        }

        try {
            const link = await db.createLink(slug, normalizedUrl);
            return created(link);
        } catch (e) {
            // The old code checked for an existing slug and then inserted, so two
            // concurrent requests could both pass the check and the loser surfaced
            // as a generic 500. Let the UNIQUE constraint decide instead.
            if (isUniqueConstraintError(e)) {
                return new Response('Slug already in use', { status: 409 });
            }
            console.error('[Create] Error creating link:', e);
            return new Response('Error creating link', { status: 500 });
        }
    }

    // No slug requested: generate one, retrying only on a genuine collision.
    for (let attempt = 0; attempt < SLUG_GENERATION_ATTEMPTS; attempt++) {
        try {
            const link = await db.createLink(generateSlug(), normalizedUrl);
            return created(link);
        } catch (e) {
            if (isUniqueConstraintError(e)) continue;
            console.error('[Create] Error creating link:', e);
            return new Response('Error creating link', { status: 500 });
        }
    }

    console.error(`[Create] Could not find a free slug in ${SLUG_GENERATION_ATTEMPTS} attempts`);
    return new Response('Could not generate unique slug', { status: 500 });
}

function created(link: unknown): Response {
    return new Response(JSON.stringify(link), {
        status: 201,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
        },
    });
}

function isUniqueConstraintError(e: unknown): boolean {
    const message = e instanceof Error ? e.message : String(e);
    return /UNIQUE constraint failed/i.test(message);
}
