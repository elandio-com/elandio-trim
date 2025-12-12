import { router } from './router';
import { addSecurityHeaders } from './middleware/securityHeaders';
import { rateLimit } from './middleware/rateLimit';
import { Env } from './types';

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // [SECURITY] Basic Rate Limiting (In-Memory)
        // Note: For production, we recommend Cloudflare WAF Rate Limiting.
        const rateLimitError = await rateLimit(request);
        if (rateLimitError) return rateLimitError;

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
