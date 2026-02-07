import { Env } from '../types';

export function validateUrl(url: string, env?: Env): boolean {
    try {
        // Reject characters that are almost never used in legitimate URLs
        // and can introduce confusion or abuse.
        if (/[<>"'\x00-\x1F\x7F]/.test(url)) return false;

        const isDev = env?.ENVIRONMENT === 'development';

        // In dev, allow http
        if (!isDev && !url.startsWith('https://')) return false;

        const u = new URL(url);

        // In dev, allow localhost/IPs
        if (isDev) return true;

        // Production checks
        // Prevent localhost, IPs, and internal domains
        if (!u.hostname.includes('.')) return false; // Must have at least one dot (basic TLD check)
        if (isPrivateHost(u.hostname)) return false;

        return true;
    } catch (e) {
        return false;
    }
}

function isPrivateHost(hostname: string): boolean {
    const host = hostname.toLowerCase();
    if (host === 'localhost') return true;
    if (host.endsWith('.local')) return true;

    // IPv6 localhost / unique-local / link-local
    if (host === '::1') return true;
    if (host.startsWith('fc') || host.startsWith('fd')) return true; // fc00::/7
    if (host.startsWith('fe80:')) return true; // fe80::/10

    // IPv4 literal checks
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4Match) return false;

    const octets = ipv4Match.slice(1).map(o => Number(o));
    if (octets.some(o => Number.isNaN(o) || o < 0 || o > 255)) return true;

    const [a, b] = octets;
    // 10.0.0.0/8
    if (a === 10) return true;
    // 127.0.0.0/8
    if (a === 127) return true;
    // 169.254.0.0/16
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;

    return false;
}
