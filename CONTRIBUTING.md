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

# Start local development server
npm run dev

# Initialize local database
npx wrangler d1 execute url-shortener-db --local --file=./database/schema.sql
```

## Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Add comments for complex logic
- Keep functions small and focused

## Testing

Before submitting a PR, please test:
- ✅ Link creation (with and without custom slug)
- ✅ Link redirection
- ✅ Dashboard authentication
- ✅ Settings management
- ✅ Search and pagination
- ✅ Edit and delete operations

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
