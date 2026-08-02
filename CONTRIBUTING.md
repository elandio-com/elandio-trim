# Contributing to Elandio URL Shortener

Thank you for your interest in contributing! 🎉

## How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly** - Run `npm run dev` and test all features
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

## Development Setup

```bash
# Install dependencies
npm install

# Local admin token (.dev.vars is gitignored)
printf 'ENVIRONMENT="development"\nADMIN_TOKEN="dev-token"\n' > .dev.vars

# Start local development server
npm run dev
```

Then open `http://localhost:8787/setup.html` once to create the tables.

## Code Style

- Use TypeScript for type safety — `npm run typecheck` must pass (`strict` mode)
- Follow existing code formatting
- Comment *why*, not *what*. Never describe a guarantee the code doesn't provide
- Keep functions small and focused

## Schema changes

`src/worker/schema.ts` is the single source of truth. Edit it, then regenerate
the SQL file so the two cannot drift:

```bash
npm run schema:sql
```

Do not edit `database/schema.sql` by hand — it is generated.

## Testing

There is no automated test suite yet; adding one is a welcome contribution. The
pure functions in `src/worker/utils/` (`validateUrl`, `slug`, `auth`) are the
natural starting point.

Until then, before submitting a PR please verify manually:
- ✅ `npm run typecheck` passes
- ✅ Link creation, with and without a custom slug
- ✅ Duplicate slug returns 409; reserved slug returns 400
- ✅ Link redirection, and that the click count increments
- ✅ Dashboard authentication, and that a wrong token is rejected
- ✅ Settings management, including an invalid fallback URL being rejected
- ✅ Search, pagination, edit and delete
- ✅ Browser console is free of CSP violations on every page

## Feature Requests

Have an idea? Open an issue with:
- Clear description of the feature
- Use case / why it's needed
- Example of how it would work

## Bug Reports

Found a bug? Open an issue with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment (browser, OS, etc.)

## Questions?

Feel free to open a discussion or issue!

---

**Note:** This project prioritizes simplicity and ease of use for non-technical users. Keep that in mind when proposing features.
