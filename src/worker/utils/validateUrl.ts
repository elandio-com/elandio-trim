import { Env } from '../types';

export function validateUrl(url: string, env?: Env): boolean {
    try {
        const isDev = env?.ENVIRONMENT === 'development';

        // In dev, allow http
        if (!isDev && !url.startsWith('https://')) return false;

        const u = new URL(url);

        // In dev, allow localhost/IPs
        if (isDev) return true;

        // Production checks
        // Prevent localhost, IPs, and internal domains
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return false;
        if (!u.hostname.includes('.')) return false; // Must have at least one dot (basic TLD check)

        return true;
    } catch (e) {
        return false;
    }
}
