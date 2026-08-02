# Deployment Guide

This guide will walk you through deploying your URL shortener to Cloudflare Workers.

## Prerequisites

- Cloudflare account (free tier works!)
- A domain (optional but recommended)
- 10-15 minutes

---

> **On one-click deploy:** there isn't one, and there can't be a complete one.
> The deploy button cannot provision a D1 database and write its id back into
> `wrangler.toml`, so a button-only deploy would come up with a broken database
> binding. The steps below are the supported path.

---

## Deployment

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser - click "Allow" to authenticate.

### Step 3: Create D1 Database

```bash
wrangler d1 create elandio-trim-db
```

**Important:** Copy the `database_id` from the output!

### Step 4: Update Configuration

Edit `wrangler.toml` and replace the `database_id`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "elandio-trim-db"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste here
```

### Step 5: Deploy

```bash
wrangler deploy
```

Wrangler will output your worker URL, something like:
```
https://url-shortener.your-name.workers.dev
```

### Step 6: Set Admin Token

Generate a real random token — do **not** invent a memorable one. `/api/admin/login`
validates submitted tokens, so a guessable token will eventually be guessed:

```bash
openssl rand -base64 32
```

Store it as an encrypted secret:

```bash
wrangler secret put ADMIN_TOKEN
```

Or via the dashboard: **Workers & Pages** → your worker → **Settings** →
**Variables** → **Add variable**, name `ADMIN_TOKEN`, paste the value, tick
**Encrypt**, then **Deploy**.

> Never put `ADMIN_TOKEN` in `wrangler.toml` — that file is committed to git and
> its values are stored and displayed in plain text.

### Step 7: Initialize Database

Visit your worker URL and add `/setup.html`:
```
https://url-shortener.your-name.workers.dev/setup.html
```

The auto-setup wizard will initialize your database. You'll see a success message!

### Step 8: Access Dashboard

Visit:
```
https://url-shortener.your-name.workers.dev/dashboard.html
```

Login with your `ADMIN_TOKEN` and start creating short links! 🎉

---

## Adding a Custom Domain

### Prerequisites
- Your domain must use Cloudflare nameservers ([Setup guide](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/))

### Steps

1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Click your worker
3. Go to **Triggers** tab
4. Click **Add Custom Domain**
5. Enter your subdomain (e.g., `short.yourdomain.com`)
6. Click **Add Custom Domain**

Cloudflare handles DNS automatically! Wait 1-2 minutes, then visit your custom domain.

**Pro Tip:** Go to Settings in your dashboard and enter your custom domain there for reference.

---



## Troubleshooting

### "Unauthorized" Error
- Make sure you set `ADMIN_TOKEN` in Cloudflare Dashboard
- Click **Deploy** after adding the variable
- Clear browser cache and try again

### Database Not Initialized
- Visit `/setup.html` directly
- Check browser console for errors
- Verify `database_id` in `wrangler.toml` is correct

### Custom Domain Not Working
- Wait 1-2 minutes for DNS propagation
- Verify domain shows "Active" in Cloudflare
- Check that domain uses Cloudflare nameservers

### Links Not Redirecting
- Verify database was initialized (visit `/api/health`)
- Check Cloudflare Dashboard logs for errors
- Make sure slug exists (check dashboard)

---

## Updating Your Deployment

When you make changes:

```bash
# Deploy updated code
wrangler deploy

# If database schema changed
wrangler d1 execute elandio-trim-db --remote --file=./database/schema.sql
```

---

## Cost

Cloudflare's free tier is comfortably enough for personal and small-business use.
Quoted limits go stale, so check the current numbers directly:

- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)

The figure worth watching is **D1 writes**: every redirect performs one to count
the click, so writes scale with link traffic rather than with the number of
links. Redirect rate limiting is enabled by default partly to keep that bounded.

---

## Next Steps

- ⭐ Star the repo if you find it useful!
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features via GitHub Discussions
- 🤝 Contribute improvements via Pull Requests

Happy shortening! 🚀
