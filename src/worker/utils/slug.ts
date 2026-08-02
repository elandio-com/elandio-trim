/**
 * Single source of truth for what a slug may look like and which slugs are
 * off-limits. Both the router (which resolves incoming paths) and the create
 * endpoint (which validates requested slugs) import from here, so the two can
 * no longer drift apart and produce links that are accepted but never resolve.
 */

export const SLUG_MIN_LENGTH = 1;
export const SLUG_MAX_LENGTH = 50;

/**
 * A slug is a single path segment of unreserved URL characters. Anything
 * containing a dot or a slash is therefore never a slug, which is what lets the
 * router hand static assets (/styles.css, /vendor/tailwind.js) straight to the
 * asset handler without needing to enumerate them.
 */
export const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Names that would otherwise collide with a page, an asset directory, or an API route. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
    '404',
    'admin',
    'api',
    'assets',
    'dashboard',
    'fonts',
    'health',
    'index',
    'setup',
    'settings',
    'vendor',
]);

export type SlugValidationError =
    | 'invalid_characters'
    | 'invalid_length'
    | 'reserved';

/** Returns null when the slug is usable, otherwise the reason it is not. */
export function validateSlug(slug: string): SlugValidationError | null {
    if (slug.length < SLUG_MIN_LENGTH || slug.length > SLUG_MAX_LENGTH) {
        return 'invalid_length';
    }
    if (!SLUG_PATTERN.test(slug)) {
        return 'invalid_characters';
    }
    if (isReservedSlug(slug)) {
        return 'reserved';
    }
    return null;
}

/**
 * Reserved if it collides with a known name, or with any file actually served
 * from /src/pages. Slugs cannot contain dots, so a request for `dashboard.html`
 * is never slug-shaped; we still reserve the stem (`dashboard`) so that the
 * pretty URL cannot be shadowed by a link.
 */
export function isReservedSlug(slug: string): boolean {
    return RESERVED_SLUGS.has(slug.toLowerCase());
}

/** True when a path segment could refer to a link at all. */
export function isSlugShaped(candidate: string): boolean {
    return (
        candidate.length >= SLUG_MIN_LENGTH &&
        candidate.length <= SLUG_MAX_LENGTH &&
        SLUG_PATTERN.test(candidate)
    );
}
