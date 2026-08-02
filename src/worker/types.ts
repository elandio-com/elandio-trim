export interface Link {
    id?: number;
    slug: string;
    target_url: string;
    clicks: number;
    created_at?: string;
}

export interface DatabaseAdapter {
    getLink(slug: string): Promise<Link | null>;
    createLink(slug: string, targetUrl: string): Promise<Link>;
    listLinks(): Promise<Link[]>;
    /** Resolves true when a row was actually removed. */
    deleteLink(slug: string): Promise<boolean>;
    /** Resolves true when a row was actually updated. */
    updateLink(slug: string, newTargetUrl: string): Promise<boolean>;
    incrementClicks(slug: string): Promise<void>;
    getSetting(key: string): Promise<string | null>;
    setSetting(key: string, value: string): Promise<void>;
    getAllSettings(): Promise<Record<string, string>>;
}

export interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
    /** Static admin credential. Required; the worker refuses to serve without it. */
    ADMIN_TOKEN: string;
    /** Optional redirect target for unknown slugs. The DB setting takes precedence. */
    FALLBACK_URL?: string;
    /** 'development' relaxes URL validation to allow http:// and localhost targets. */
    ENVIRONMENT?: string;
}
