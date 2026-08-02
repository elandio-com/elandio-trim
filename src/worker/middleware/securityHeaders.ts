export const securityHeaders: Record<string, string> = {
    // Everything the pages need is served from this origin: Tailwind is vendored
    // under /vendor/, the Outfit font under /fonts/, and every script lives in its
    // own file. So script-src needs no 'unsafe-inline' and no third-party hosts.
    //
    // style-src keeps 'unsafe-inline' because the vendored Tailwind browser build
    // generates utility CSS at runtime and injects it as an inline <style> element.
    // Removing that requires compiling Tailwind ahead of time (i.e. a build step).
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "base-uri 'none'",
        "object-src 'none'",
    ].join('; '),
    // 'preload' is deliberately omitted: submitting to the HSTS preload list is a
    // slow-to-reverse commitment that should be an explicit operator decision,
    // not something a self-hosted default opts you into.
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
};

export const addSecurityHeaders = (response: Response): Response => {
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(securityHeaders)) {
        newHeaders.set(key, value);
    }
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
};
