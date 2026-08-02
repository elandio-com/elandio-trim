import { handle } from './router';
import { addSecurityHeaders } from './middleware/securityHeaders';
import {
    checkRateLimit,
    clientKey,
    tooManyRequests,
    API_RATE_LIMIT,
    REDIRECT_RATE_LIMIT,
} from './middleware/rateLimit';
import { isAdminTokenConfigured } from './utils/auth';
import { isSlugShaped } from './utils/slug';
import { Env } from './types';

/** Paths that must stay reachable before ADMIN_TOKEN has been configured. */
const BOOTSTRAP_PATHS = new Set(['/api/health', '/api/setup', '/setup.html', '/setup.js']);

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        // Refuse to serve an unconfigured deployment, except for the handful of
        // paths the operator needs in order to finish configuring it.
        if (!isAdminTokenConfigured(env) && !BOOTSTRAP_PATHS.has(path)) {
            console.error('[Worker] ADMIN_TOKEN is not configured');
            return addSecurityHeaders(
                new Response('Server configuration error. Please set ADMIN_TOKEN.', { status: 500 })
            );
        }

        // Redirects are rate limited too, not just /api/*. Each one performs a D1
        // write to count the click, so leaving them unlimited let anyone burn the
        // operator's write quota.
        //
        // Static assets are deliberately excluded: one dashboard page load pulls
        // roughly seven files, and throttling those would break the UI rather than
        // protect anything — serving them costs no database work.
        const isApi = path.startsWith('/api/');
        const isSlugLookup = !isApi && isSlugShaped(path.slice(1));

        if (isApi || isSlugLookup) {
            const rule = isApi ? API_RATE_LIMIT : REDIRECT_RATE_LIMIT;
            if (!checkRateLimit(clientKey(request), rule, isApi ? 'api' : 'redirect')) {
                return addSecurityHeaders(tooManyRequests(Math.ceil(rule.windowMs / 1000)));
            }
        }

        try {
            return addSecurityHeaders(await handle(request, env, ctx));
        } catch (e) {
            // Log server-side; never return internals to the client.
            console.error('[Worker] Unhandled error:', e);
            return addSecurityHeaders(new Response('Internal Server Error', { status: 500 }));
        }
    },
};
