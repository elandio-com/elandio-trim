-- GENERATED FILE — do not edit by hand.
-- Source: src/worker/schema.ts  •  Regenerate: npm run schema:sql
--
-- Applied automatically by POST /api/setup. Provided here for operators who
-- prefer: wrangler d1 execute <db> --file=./database/schema.sql

CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
