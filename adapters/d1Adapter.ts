import { DatabaseAdapter, Link } from '../src/worker/types';

export class D1Adapter implements DatabaseAdapter {
    constructor(private db: D1Database) { }

    async getLink(slug: string): Promise<Link | null> {
        return this.db.prepare('SELECT * FROM links WHERE slug = ?').bind(slug).first<Link>();
    }

    async createLink(slug: string, targetUrl: string): Promise<Link> {
        await this.db.prepare('INSERT INTO links (slug, target_url) VALUES (?, ?)').bind(slug, targetUrl).run();
        return { slug, target_url: targetUrl, clicks: 0, created_at: new Date().toISOString() };
    }

    async listLinks(): Promise<Link[]> {
        console.log('[D1] listLinks called');
        const stmt = this.db.prepare('SELECT * FROM links ORDER BY created_at DESC');
        console.log('[D1] Statement prepared');
        const result = await stmt.all<Link>();
        console.log('[D1] Query executed');
        return result.results || [];
    }

    async deleteLink(slug: string): Promise<void> {
        await this.db.prepare('DELETE FROM links WHERE slug = ?').bind(slug).run();
    }

    async updateLink(slug: string, newTargetUrl: string): Promise<void> {
        await this.db.prepare('UPDATE links SET target_url = ? WHERE slug = ?').bind(newTargetUrl, slug).run();
    }

    async incrementClicks(slug: string): Promise<void> {
        await this.db.prepare('UPDATE links SET clicks = clicks + 1 WHERE slug = ?').bind(slug).run();
    }

    async getSetting(key: string): Promise<string | null> {
        const result = await this.db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
        return result?.value || null;
    }

    async setSetting(key: string, value: string): Promise<void> {
        await this.db.prepare(
            'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP'
        ).bind(key, value, value).run();
    }

    async getAllSettings(): Promise<Record<string, string>> {
        const result = await this.db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
        const settings: Record<string, string> = {};
        result.results?.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }
}
