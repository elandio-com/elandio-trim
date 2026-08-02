/* Shared Tailwind theme for every page.
 *
 * This lives in its own file rather than an inline <script> so that the
 * Content-Security-Policy can drop 'unsafe-inline' from script-src.
 * Must be loaded *after* vendor/tailwind.js, which defines the `tailwind` global.
 */
tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
            },
        },
    },
};
