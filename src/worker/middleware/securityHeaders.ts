export const securityHeaders = {
    // CSP: Allow self-hosted scripts/styles, inline styles (Tailwind), and Cloudflare challenges
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self' data:;",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // CORS: Allow same-origin requests only (for API endpoints)
    'Access-Control-Allow-Origin': '*', // Will be overridden per-route if needed
};

export const addSecurityHeaders = (response: Response, options?: { allowCors?: boolean }): Response => {
    const newHeaders = new Headers(response.headers);
    Object.entries(securityHeaders).forEach(([key, value]) => {
        // Skip CORS header if not explicitly allowed
        if (key === 'Access-Control-Allow-Origin' && !options?.allowCors) {
            return;
        }
        newHeaders.set(key, value);
    });
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
};
