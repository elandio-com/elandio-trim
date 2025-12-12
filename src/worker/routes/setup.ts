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

export async function setupDatabase(request: IRequest, env: Env): Promise<Response> {
    try {
        const db = new D1Adapter(env.DB);

        // Check if already initialized
        try {
            const setupComplete = await db.getSetting('setup_complete');
            if (setupComplete === 'true') {
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
