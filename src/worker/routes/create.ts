// @ts-ignore
import { IRequest } from 'itty-router';
import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';
import { validateUrl } from '../utils/validateUrl';
import { generateSlug } from '../utils/generateSlug';

function getDb(env: Env) {
    return new D1Adapter(env.DB);
}

export async function createLink(request: IRequest, env: Env): Promise<Response> {
    // 1. Auth Check (SECURITY: removed query parameter token support)
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.headers.get('x-admin-token');
    if (token !== env.ADMIN_TOKEN) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { url, slug } = await request.json() as { url: string, slug?: string };

    // 2. Validation
    if (!url || !validateUrl(url, env)) {
        return new Response('Invalid URL', { status: 400 });
    }

    // 3. DB Init
    const db = getDb(env);

    // 5. Slug Generation logic
    let finalSlug = slug;
    if (!finalSlug) {
        let attempts = 0;
        while (attempts < 5) {
            const candidate = generateSlug();
            const existing = await db.getLink(candidate);
            if (!existing) {
                finalSlug = candidate;
                break;
            }
            attempts++;
        }
        if (!finalSlug) return new Response('Could not generate unique slug', { status: 500 });
    } else {
        // SECURITY: Validate custom slug format
        // Only allow alphanumeric characters, hyphens, and underscores
        if (!/^[a-zA-Z0-9_-]+$/.test(finalSlug)) {
            return new Response('Slug can only contain letters, numbers, hyphens, and underscores', { status: 400 });
        }

        // Check length
        if (finalSlug.length < 1 || finalSlug.length > 50) {
            return new Response('Slug must be between 1 and 50 characters', { status: 400 });
        }

        // Check reserved slugs
        const denied = ['api', 'admin', 'dashboard', 'assets', 'favicon.ico', 'setup', 'health', 'settings', 'styles.css', 'dashboard.html', 'dashboard.js', '404.html', 'setup.html'];
        if (denied.includes(finalSlug.toLowerCase())) {
            return new Response('Slug reserved', { status: 400 });
        }

        const existing = await db.getLink(finalSlug);
        if (existing) {
            return new Response('Slug already in use', { status: 409 });
        }
    }

    // 6. Save
    try {
        const link = await db.createLink(finalSlug, url);
        return new Response(JSON.stringify(link), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        return new Response('Error creating link: ' + e.message, { status: 500 });
    }
}
