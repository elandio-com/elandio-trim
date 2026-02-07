// @ts-ignore
import { IRequest } from 'itty-router';
import { Env } from '../types';
import { D1Adapter } from '../../../adapters/d1Adapter';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Simple in-memory rate limit for setup endpoint (per IP, 1/minute).
const setupRequests = new Map<string, number>();

export async function setupDatabase(request: IRequest, env: Env): Promise<Response> {
    try {
        // [SECURITY] Rate limit setup endpoint to prevent abuse
        // Allow only one setup per minute per IP
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        const now = Date.now();
        const lastAttempt = setupRequests.get(clientIp) || 0;
        if (now - lastAttempt < 60_000) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Rate limit exceeded. Please try again later.'
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        setupRequests.set(clientIp, now);
        // Note: This is a basic check. For production, use Cloudflare Rate Limiting rules.
        
        const db = new D1Adapter(env.DB);

        // Check if already initialized
        try {
            const setupComplete = await db.getSetting('setup_complete');
            if (setupComplete === 'true') {
                // [SECURITY] Once initialized, prevent re-initialization unless authenticated
                // This prevents database reset attacks
                const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.headers.get('x-admin-token');
                if (!token || token !== env.ADMIN_TOKEN) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Database already initialized. Admin authentication required to reset.'
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Database already initialized',
                    redirect: '/dashboard.html'
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } catch (e) {
            // Table doesn't exist yet, continue with setup
        }

        // Execute schema
        const statements = SCHEMA_SQL.split(';').filter(s => s.trim());
        for (const statement of statements) {
            if (statement.trim()) {
                await env.DB.prepare(statement).run();
            }
        }

        // Mark setup as complete
        await db.setSetting('setup_complete', 'true');

        return new Response(JSON.stringify({
            success: true,
            message: 'Database initialized successfully!',
            redirect: '/dashboard.html'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error('[Setup] Error:', e);
        return new Response(JSON.stringify({
            success: false,
            error: e.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
