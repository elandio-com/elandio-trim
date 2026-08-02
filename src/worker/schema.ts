/**
 * The single source of truth for the database schema.
 *
 * There used to be three copies — database/schema.sql, database/schema_with_indexes.sql,
 * and a string literal inside routes/setup.ts — which had already drifted apart.
 * The inlined copy was the one that actually ran, so the indexes in
 * schema_with_indexes.sql were never applied to any real deployment.
 *
 * database/schema.sql is generated from this file by `npm run schema:sql`, for
 * operators who prefer to apply it with `wrangler d1 execute --file`.
 */
export const SCHEMA_STATEMENTS: readonly string[] = [
    `CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        target_url TEXT NOT NULL,
        clicks INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Slug lookups already use the implicit index created by UNIQUE, so no extra
    // index is defined for it. This one backs the dashboard's default ordering.
    `CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC)`,

    `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
];

/** The schema as a single .sql script. */
export function schemaToSql(): string {
    return SCHEMA_STATEMENTS.map(s => `${collapseIndent(s)};`).join('\n\n');
}

function collapseIndent(sql: string): string {
    return sql
        .split('\n')
        .map(line => line.replace(/^ {4}/, ''))
        .join('\n')
        .trim();
}
