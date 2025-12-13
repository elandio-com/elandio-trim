# Elandio Trim - URL Shortener

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/elandio-com/elandio-trim)

A simple, powerful, and self-hostable URL shortener built on **Cloudflare Workers**, **D1 Database**, and **Vanilla JS**. Designed for dedicated domains (e.g., `link.yourdomain.com`).plicity.

---

## ✨ Features

- 🚀 **One-Click Deploy** - Live in 60 seconds
- 🎨 **Beautiful Dashboard** - Modern, premium UI
- ⚙️ **Dashboard Config** - Zero code editing required
- 🔒 **Secure** - Admin authentication, input validation
- 📊 **Analytics** - Click tracking and statistics
- 🌐 **Custom Domains** - Use your own domain
- 💰 **100% Free** - Runs on Cloudflare's free tier
- 🎯 **Auto-Setup** - Database initializes automatically

---

## 🚀 Quick Deploy (Web Interface)

**No coding or terminal required!** Follow these steps:

### Phase 1: Create the Project
1.  **Click the "Deploy to Cloudflare Workers" button** above ☝️.
2.  Connect your GitHub account.
3.  Cloudflare will fork this repository to your account and attempt to deploy.
4.  🚨 **The initial deployment will FAIL.** This is expected! (It fails because it needs your unique Database ID).

### Phase 2: Create the Database
1.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2.  Go to **Storage & Databases** > **D1**.
3.  Click **Create**. Name it `elandio-trim-db`.
4.  **Copy the Database ID** (it looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

### Phase 3: Configure & Launch
1.  Go to **Your GitHub Repository** (the one Cloudflare created for you).
2.  Open the file `wrangler.toml`.
3.  Click the ✏️ (Pencil Icon) to edit.
4.  **Update Database ID**: Replace `xx-REPLACE-WITH-YOUR-DB-ID-xx` with your real ID.
5.  **Set Password**: Change `ADMIN_TOKEN = ""` to `ADMIN_TOKEN = "your-secure-password"`.
6.  Click **Commit changes**.
7.  **Done!** Cloudflare will automatically detect the change, rebuild, and deploy successfully in seconds. 🎉

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

# Start development server
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
✅ **Open Redirect Prevention** - URL validation  

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

---

## 💰 Cost

**Free Tier Limits:**
- 100,000 requests/day
- 10 GB storage
- Unlimited D1 reads
- 5 million D1 writes/month

**More than enough for personal/small business use!**

Paid plan: $5/month for 10 million requests (if needed).

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
