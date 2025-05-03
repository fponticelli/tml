# TML Monorepo

This is a monorepo for the Typed Markup Language (TML) ecosystem.

## Development Workflow

This project uses pre-commit hooks to ensure code quality. The hooks run:

- Linting
- Formatting
- Tests

These checks run automatically when you commit changes.

## Packages

- [tml-parser](./packages/tml-parser): A parser for the Typed Markup Language

## Development

This monorepo uses [Turborepo](https://turbo.build/repo) for managing the build process.

### Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Development mode
npm run dev
```

## License

MIT
