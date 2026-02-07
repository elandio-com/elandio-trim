import { router } from './router';
import { addSecurityHeaders } from './middleware/securityHeaders';
import { rateLimit } from './middleware/rateLimit';
import { Env } from './types';

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // [SECURITY] Validate ADMIN_TOKEN is configured
        // This prevents deployment without proper authentication
        if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.trim().length === 0) {
            const url = new URL(request.url);
            // Allow health check and setup to work without ADMIN_TOKEN
            if (url.pathname !== '/api/health' && url.pathname !== '/api/setup' && !url.pathname.startsWith('/setup.html')) {
                console.error('[Worker] ADMIN_TOKEN not configured!');
                return addSecurityHeaders(new Response('Server configuration error. Please set ADMIN_TOKEN.', { status: 500 }));
            }
        }

        // [SECURITY] Basic Rate Limiting (In-Memory)
        // Note: In-memory rate limiting is ephemeral in Workers. For production,
        // use Cloudflare WAF Rate Limiting rules or Cloudflare KV for distributed rate limiting.
        // This provides basic protection but may not be fully effective in distributed scenarios.
        const url = new URL(request.url);
        if (url.pathname.startsWith('/api/')) {
            const rateLimitError = await rateLimit(request);
            if (rateLimitError) return rateLimitError;
        }

        console.log(`[Worker] Incoming request: ${request.method} ${request.url}`);

        try {
            const response = await router.handle(request, env, ctx);
            // [SECURITY] Apply Security Headers (HSTS, CSP, etc.)
            return addSecurityHeaders(response);
        } catch (e: any) {
            // [SECURITY] Prevent Error Leakage
            console.error('[Worker] Error handling request:', e);
            return addSecurityHeaders(new Response('Internal Server Error', { status: 500 }));
        }
    },
};
