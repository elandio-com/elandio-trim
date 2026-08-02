/**
 * Regenerates database/schema.sql from the schema defined in src/worker/schema.ts,
 * so the file operators run by hand can never drift from the one setup applies.
 *
 * Usage: npm run schema:sql
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'src/worker/schema.ts'), 'utf8');

// Pull the statements out of the TS source with a regex rather than compiling it,
// which keeps this script dependency-free.
const arrayMatch = source.match(/SCHEMA_STATEMENTS[^=]*=\s*\[([\s\S]*?)\n\];/);
if (!arrayMatch) {
    console.error('Could not find SCHEMA_STATEMENTS in src/worker/schema.ts');
    process.exit(1);
}

const statements = [...arrayMatch[1].matchAll(/`([^`]+)`/g)].map(m =>
    m[1]
        .split('\n')
        .map(line => line.replace(/^ {4}/, ''))
        .join('\n')
        .trim()
);

if (statements.length === 0) {
    console.error('No SQL statements found in SCHEMA_STATEMENTS');
    process.exit(1);
}

const header = `-- GENERATED FILE — do not edit by hand.
-- Source: src/worker/schema.ts  •  Regenerate: npm run schema:sql
--
-- Applied automatically by POST /api/setup. Provided here for operators who
-- prefer: wrangler d1 execute <db> --file=./database/schema.sql
`;

const body = statements.map(s => `${s};`).join('\n\n');
writeFileSync(join(root, 'database/schema.sql'), `${header}\n${body}\n`);

console.log(`Wrote database/schema.sql (${statements.length} statements)`);
