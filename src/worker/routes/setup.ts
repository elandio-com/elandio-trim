import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';
import { isAuthorized } from '../utils/auth';
import { checkRateLimit, clientKey, SETUP_RATE_LIMIT } from '../middleware/rateLimit';
import { SCHEMA_STATEMENTS } from '../schema';

export async function setupDatabase(request: Request, env: Env): Promise<Response> {
    if (!checkRateLimit(clientKey(request), SETUP_RATE_LIMIT, 'setup')) {
        return json({ success: false, error: 'Rate limit exceeded. Please try again later.' }, 429);
    }

    if (!env.DB) {
        console.error('[Setup] D1 binding "DB" is missing');
        return json({ success: false, error: 'Database binding is not configured.' }, 500);
    }

    const db = new D1Adapter(env.DB);

    // Once initialised, only an authenticated admin may re-run setup.
    try {
        if ((await db.getSetting('setup_complete')) === 'true') {
            if (!isAuthorized(request, env)) {
                return json(
                    { success: false, error: 'Database already initialized. Admin authentication required to reset.' },
                    403
                );
            }
            return json({ success: true, message: 'Database already initialized', redirect: '/dashboard.html' }, 200);
        }
    } catch {
        // Settings table does not exist yet — expected on a first run.
    }

    try {
        // Every statement is CREATE ... IF NOT EXISTS, so re-running is a no-op
        // and never drops existing links.
        for (const statement of SCHEMA_STATEMENTS) {
            await env.DB.prepare(statement).run();
        }
        await db.setSetting('setup_complete', 'true');

        return json({ success: true, message: 'Database initialized successfully!', redirect: '/dashboard.html' }, 200);
    } catch (e) {
        // Logged in full server-side; the client gets a generic message so that
        // schema and driver details are not exposed to an unauthenticated caller.
        console.error('[Setup] Error:', e);
        return json({ success: false, error: 'Database initialization failed. Check the worker logs.' }, 500);
    }
}

function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
        },
    });
}
