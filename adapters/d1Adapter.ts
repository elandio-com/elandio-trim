import { DatabaseAdapter, Link } from '../src/worker/types';

export class D1Adapter implements DatabaseAdapter {
    constructor(private db: D1Database) { }

    async getLink(slug: string): Promise<Link | null> {
        return this.db
            .prepare('SELECT * FROM links WHERE slug = ?')
            .bind(slug)
            .first<Link>();
    }

    /**
     * Returns the row as the database actually stored it. The previous version
     * fabricated the result client-side, so `id` was missing and `created_at`
     * was the worker's clock rather than the database's.
     */
    async createLink(slug: string, targetUrl: string): Promise<Link> {
        const row = await this.db
            .prepare('INSERT INTO links (slug, target_url) VALUES (?, ?) RETURNING *')
            .bind(slug, targetUrl)
            .first<Link>();

        if (!row) throw new Error('Insert returned no row');
        return row;
    }

    async listLinks(): Promise<Link[]> {
        const result = await this.db
            .prepare('SELECT * FROM links ORDER BY created_at DESC, id DESC')
            .all<Link>();
        return result.results || [];
    }

    /** Resolves true when a row was actually removed. */
    async deleteLink(slug: string): Promise<boolean> {
        const result = await this.db
            .prepare('DELETE FROM links WHERE slug = ?')
            .bind(slug)
            .run();
        return (result.meta?.changes ?? 0) > 0;
    }

    /** Resolves true when a row was actually updated. */
    async updateLink(slug: string, newTargetUrl: string): Promise<boolean> {
        const result = await this.db
            .prepare('UPDATE links SET target_url = ? WHERE slug = ?')
            .bind(newTargetUrl, slug)
            .run();
        return (result.meta?.changes ?? 0) > 0;
    }

    async incrementClicks(slug: string): Promise<void> {
        await this.db
            .prepare('UPDATE links SET clicks = clicks + 1 WHERE slug = ?')
            .bind(slug)
            .run();
    }

    async getSetting(key: string): Promise<string | null> {
        const result = await this.db
            .prepare('SELECT value FROM settings WHERE key = ?')
            .bind(key)
            .first<{ value: string }>();
        return result?.value || null;
    }

    async setSetting(key: string, value: string): Promise<void> {
        await this.db
            .prepare(
                `INSERT INTO settings (key, value, updated_at)
                 VALUES (?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
            )
            .bind(key, value)
            .run();
    }

    async getAllSettings(): Promise<Record<string, string>> {
        const result = await this.db
            .prepare('SELECT key, value FROM settings')
            .all<{ key: string; value: string }>();

        const settings: Record<string, string> = {};
        for (const row of result.results || []) {
            settings[row.key] = row.value;
        }
        return settings;
    }
}
