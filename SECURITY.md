# Security

## Reporting a vulnerability

Please report security issues privately to **security@elandio.com** rather than
opening a public issue. Include steps to reproduce and the version or commit you
tested. Expect an acknowledgement within a few days.

---

## Threat model

Elandio Trim is a **single-admin, self-hosted** application. Understanding what
that means is the most important part of running it safely:

- There are **no user accounts and no sessions**. A single static `ADMIN_TOKEN`
  is the credential, sent on every admin request. Anyone holding it has full
  control of every link.
- The token is stored in the browser's `sessionStorage`, which means **any script
  running on the dashboard origin can read it**. The CSP is what keeps that
  surface small (see below).
- Everyone who can reach the worker can use every short link. Links are public by
  design; do not shorten a URL that is itself a secret.

This model is deliberate — it keeps a self-hosted deployment to one moving part.
It is not appropriate for multi-tenant or multi-user use.

## Choosing an ADMIN_TOKEN

`POST /api/admin/login` validates a submitted token, so it is an online guessing
oracle. Rate limiting slows that down but does not stop a distributed attacker
(see below). **The token's length is what actually protects you.**

Generate one properly, and never reuse a password you use elsewhere:

```bash
openssl rand -base64 32
```

Set it as an encrypted secret, not as a plaintext var in `wrangler.toml`:

```bash
wrangler secret put ADMIN_TOKEN
```

The worker refuses to serve anything except `/api/health`, `/api/setup` and the
setup page until `ADMIN_TOKEN` is set, so a deployment cannot accidentally go
live unauthenticated.

## What is implemented

| Control | Notes |
| --- | --- |
| Parameterised SQL | Every query binds parameters; no string interpolation. |
| Constant-time token comparison | `utils/auth.ts`. Avoids leaking a prefix match through response timing. |
| Content-Security-Policy | `script-src 'self'` with no `unsafe-inline` — see caveat below. |
| Security headers | HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, COOP. Applied to **all** responses including HTML, which requires `run_worker_first = true` in `wrangler.toml`. |
| Redirect target validation | Rejects non-HTTPS, control characters, and private/loopback address literals in production. |
| Slug validation | Single source of truth in `utils/slug.ts`, shared by the router and the create endpoint. |
| Setup protection | Once initialised, re-running setup requires the admin token. |
| Rate limiting | Applied to `/api/*` **and** to slug lookups — see limitations. |
| Error handling | Internal errors are logged server-side; clients get generic messages. |

## Known limitations

Read these before deploying something you care about.

1. **Rate limiting is best-effort, not a guarantee.** Worker isolate state is
   ephemeral and per-isolate, so an attacker spread across isolates or regions
   gets a fresh budget in each one. For anything load-bearing, configure
   **Cloudflare WAF rate limiting rules**, which run before your worker.

2. **`style-src` still allows `'unsafe-inline'`.** The vendored Tailwind browser
   build generates CSS at runtime and injects it into a `<style>` element.
   Removing this requires compiling Tailwind ahead of time, which would add a
   build step. `script-src` is fully locked down, which is the half that matters
   most for token theft.

3. **The admin token is readable by any script on the origin.** Mitigated by the
   strict `script-src` and by there being no third-party scripts, but a stored
   XSS would still yield the token. Moving to an httpOnly session cookie would
   fix this properly and is not implemented.

4. **No CSRF tokens.** Admin endpoints authenticate via a custom header rather
   than a cookie, so a cross-site form post cannot authenticate. This holds only
   as long as no cookie-based auth is added.

5. **Redirect validation is not SSRF protection.** Private-address checks are
   applied to literal IPs at creation time; a hostname that resolves to a private
   address is not caught. This is acceptable here because the worker only issues
   a `302` and never fetches the target itself — the visitor's browser does.

6. **No audit log.** There is no record of who created or deleted which link.
   Cloudflare's own analytics and logs are the only trail.

7. **Click counts are best-effort.** Increments run via `waitUntil` after the
   redirect is sent, so a small number may be lost under failure. This is a
   deliberate trade for redirect latency.

## Deployment checklist

- [ ] `ADMIN_TOKEN` set as an **encrypted secret**, generated with `openssl rand -base64 32`
- [ ] `database_id` filled in inside `wrangler.toml`
- [ ] `run_worker_first = true` still present under `[assets]` (security headers depend on it)
- [ ] `GET /api/health` returns `{"status":"ok","database":"ok"}`
- [ ] Cloudflare WAF rate limiting rules configured if the deployment is public
- [ ] A D1 backup schedule in place: `wrangler d1 export <db> --output backup.sql`
