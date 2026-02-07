# Elandio Trim - URL Shortener

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/elandio-com/elandio-trim)

A simple, powerful, and self-hostable URL shortener built on **Cloudflare Workers**, **D1 Database**, and **Vanilla JS**. Designed for dedicated domains (e.g., `link.yourdomain.com`).

---

## ✨ Features

- 🚀 **One-Click Deploy** - Live in 60 seconds
- 🎨 **Beautiful Dashboard** - Modern, premium UI
- ⚙️ **Dashboard Config** - Zero code editing required
- 🔒 **Secure** - Admin authentication, input validation, strict headers
- 📊 **Analytics** - Click tracking and statistics
- 🌐 **Custom Domains** - Use your own domain
- 💰 **Free-Tier Friendly** - Runs comfortably on Cloudflare's free tier for most use cases
- 🎯 **Auto-Setup** - Database initializes automatically

---

## 🚀 Quick Deploy (Web Interface)

**No coding or terminal required!** Follow these steps:

### Phase 1: Click & Deploy
1.  **Click the "Deploy to Cloudflare Workers" button** above ☝️.
2.  Connect your GitHub account.
3.  Cloudflare will create the project, the database, and deploy everything automatically!

### Phase 2: Set Admin Password (Required)
*For security, we don't handle passwords during the basic setup.*
1.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2.  Go to **Workers & Pages** > Click your new project (`elandio-trim`).
3.  Go to **Settings** > **Variables**.
4.  Click **Add Variable**:
    *   Variable name: `ADMIN_TOKEN`
    *   Value: **Your Secure Password**
    *   Click **Encrypt** (Recommended) > **Save**.
5.  Wait a few seconds, then open your App URL. **Login works!** 🎉

---

## 🎯 For Developers

### Local Development

```bash
# Clone the repository
git clone https://github.com/elandio-com/elandio-trim.git
cd elandio-trim

# Install dependencies
npm install

# Create local database
npx wrangler d1 create elandio-trim-db --local

# Initialize database
npx wrangler d1 execute elandio-trim-db --local --file=./database/schema.sql

# Start development server (default port 8787)
npm run dev
```

Visit `http://localhost:8787/dashboard.html`

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 📖 Usage

### Creating Short Links

1. Visit `/dashboard.html`
2. Login with your admin password
3. Enter a URL to shorten
4. (Optional) Choose a custom slug
5. Click "Create Link"

Your short link is ready! Share it anywhere.

### Dashboard Features

**Overview Tab:**
- View all your links
- See click statistics
- Search and filter links
- Edit or delete links


### Accessing the Dashboard
Navigate to `https://link.yourdomain.com/dashboard.html` (or your workers.dev URL) and log in with your admin token.

### Creating Links
1.  Enter the target URL (e.g., `https://google.com`).
2.  Enter a custom slug (e.g., `google`) or let it auto-generate.
3.  Click **Shorten**.
4.  Your link is live at `https://link.yourdomain.com/google`.

### Settings
- **Fallback URL:** Configure where users should be redirected if they visit a non-existent link (404).

## 🔧 Configuration

You can set these in Cloudflare **Settings → Variables** (or `.dev.vars` locally):

- `ADMIN_TOKEN` (required): Static admin token used by the dashboard and API.
- `ENVIRONMENT` (optional): `development` or `production` (defaults to production).
- `FALLBACK_URL` (optional): Redirect destination for unknown slugs (404).

## 🧱 Architecture

- **Worker** handles API + redirects
- **D1** stores links and settings
- **Assets** serve static dashboard files

## 🔐 Security Model

This project is intended for **single‑admin, self‑hosted** use. It uses a **static admin token** (no user accounts, no sessions, no cookies). This is deliberate for simplicity and transparency in a self‑hosted model.

## ⚖️ Rate Limits (Default)

- `/api/*` endpoints: **5 requests/second per IP**
- `/api/setup`: **1 request/minute per IP**

If you need higher limits, adjust `src/worker/middleware/rateLimit.ts` and/or use Cloudflare WAF rate limiting.

## ⚡ API Endpoints

- `POST /api/admin/create`: Create new link
- `GET /api/admin/list`: List all links
- `DELETE /api/admin/:slug`: Delete a link
- `PUT /api/admin/settings`: Update settings

---

## 🌐 Custom Domain Setup

1. Ensure your domain uses Cloudflare nameservers
2. Go to Cloudflare Dashboard → Workers & Pages
3. Click your worker → Triggers → Add Custom Domain
4. Enter subdomain (e.g., `short.yourdomain.com`)
5. Wait 1-2 minutes for DNS

Done! Your links now use your custom domain.

---

## 🔒 Security Best Practices

### For Administrators

1. **Use a Strong Password**
   - Minimum 32 characters
   - Mix of letters, numbers, symbols
   - Generate with: `openssl rand -base64 32`



3. **Monitor Your Links**
   - Check Cloudflare Dashboard logs
   - Delete suspicious links
   - Rotate password periodically

### Built-in Security Features

✅ **Authentication** - Admin token required  
✅ **Input Validation** - URLs and slugs sanitized  
✅ **SQL Injection Protection** - Parameterized queries  
✅ **XSS Prevention** - Strict slug format  
✅ **Reserved Paths** - System routes protected  
✅ **HTTPS Only** - Cloudflare enforced  
✅ **Rate Limiting** - Built-in protection  
✅ **Open Redirect Prevention** - URL validation (blocks private IPs/localhost + unsafe characters)  

---

## 🆘 Troubleshooting

### "Unauthorized" in dashboard
- Verify `ADMIN_TOKEN` is set in Cloudflare Dashboard
- Click "Deploy" after adding the variable
- Clear browser cache

### Database not initialized
- Visit `/setup.html` directly
- Check browser console for errors
- Verify database ID in `wrangler.toml`

### Links not redirecting
- Verify database initialized (visit `/api/health`)
- Check Cloudflare Dashboard logs
- Ensure slug exists in dashboard

### Custom domain not working
- Wait 1-2 minutes for DNS propagation
- Verify domain uses Cloudflare nameservers
- Check domain shows "Active" in Cloudflare

## ✅ Manual QA (Quick Check)

- `dashboard.html` loads without console errors
- Login works with `ADMIN_TOKEN`
- Create / edit / delete links works
- Redirects work for existing slugs
- 404 fallback URL behaves as expected

---

## 💰 Cost

Cloudflare’s free tier is typically enough for personal and small business use. For current limits and pricing, refer to Cloudflare’s official pricing pages.

---

## 🛠️ Tech Stack

- **Frontend:** HTML, JavaScript, Tailwind CSS
- **Backend:** Cloudflare Workers (TypeScript)
- **Database:** Cloudflare D1 (SQLite)
- **Security:** Admin tokens, Input Validation
- **Deployment:** Wrangler CLI

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Found a bug?** Open an issue.  
**Have an idea?** Start a discussion.  
**Want to help?** Submit a PR.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Built with ❤️ by [Elandio](https://elandio.com)

Powered by:
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## ⭐ Support

If you find this useful, please:
- ⭐ Star this repository
- 🐦 Share on social media
- 🐛 Report bugs
- 💡 Suggest features

---

**Made with ❤️ by Elandio**



[Website](https://elandio.com) • [GitHub](https://github.com/elandio-com)
