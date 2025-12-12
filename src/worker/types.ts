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
    deleteLink(slug: string): Promise<void>;
    updateLink(slug: string, newTargetUrl: string): Promise<void>;
    incrementClicks(slug: string): Promise<void>;
}

export interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
    ADMIN_TOKEN: string;
    TURNSTILE_ENABLED?: string;
    TURNSTILE_SECRET_KEY?: string;
    USE_ROOT_PATH?: string; // If "true", use /abc instead of /r/abc
    FALLBACK_URL?: string; // Optional URL to redirect to on 404 (e.g., your homepage)
    ENVIRONMENT?: string; // 'production' or 'development'
}
