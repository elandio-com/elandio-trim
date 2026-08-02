import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';

/**
 * Reports whether the worker can actually reach an initialised database.
 *
 * This used to return a static "OK" while both the README and DEPLOYMENT guide
 * told operators to use it to confirm the database was initialised — so it
 * answered OK in exactly the broken state it was supposed to detect.
 *
 * Deliberately unauthenticated and deliberately vague: it reports reachable /
 * not reachable, never error details.
 */
export async function healthCheck(env: Env): Promise<Response> {
    const body = {
        status: 'ok',
        database: 'unknown' as 'ok' | 'uninitialized' | 'error' | 'unknown',
    };

    if (!env.DB) {
        body.status = 'error';
        body.database = 'error';
        return json(body, 503);
    }

    try {
        await new D1Adapter(env.DB).getSetting('setup_complete');
        body.database = 'ok';
        return json(body, 200);
    } catch (e) {
        // The settings table not existing is the expected pre-setup state, and is
        // reported distinctly so operators can tell "not set up yet" from "broken".
        const message = e instanceof Error ? e.message : String(e);
        if (/no such table/i.test(message)) {
            body.status = 'setup_required';
            body.database = 'uninitialized';
            return json(body, 503);
        }

        console.error('[Health] Database check failed:', e);
        body.status = 'error';
        body.database = 'error';
        return json(body, 503);
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
