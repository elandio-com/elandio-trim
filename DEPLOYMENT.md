# Deployment Guide

This guide will walk you through deploying your URL shortener to Cloudflare Workers.

## Prerequisites

- Cloudflare account (free tier works!)
- A domain (optional but recommended)
- 10-15 minutes

---

## Method 1: One-Click Deploy (Easiest)

**Coming Soon!** Once this repo is on GitHub, you'll be able to click the "Deploy to Cloudflare Workers" button in the README.

---

## Method 2: Manual Deployment (Current)

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

### Step 6: Set Admin Password

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click your worker
4. Go to **Settings** → **Variables**
5. Click **Add variable**
   - Name: `ADMIN_TOKEN`
   - Value: Your secure password (e.g., `MySecurePassword123!`)
6. Click **Deploy**

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
wrangler d1 execute url-shortener-db --remote --file=./database/schema.sql
```

---

## Cost

**Free Tier Limits:**
- 100,000 requests/day
- 10 GB storage
- Unlimited D1 database reads
- 5 million D1 writes/month

**This is more than enough for most personal/small business use!**

If you exceed limits, Cloudflare Workers paid plan starts at $5/month for 10 million requests.

---

## Next Steps

- ⭐ Star the repo if you find it useful!
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features via GitHub Discussions
- 🤝 Contribute improvements via Pull Requests

Happy shortening! 🚀
