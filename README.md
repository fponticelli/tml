# TML Monorepo

This is a monorepo for the Typed Markup Language (TML) ecosystem.

## Development Workflow

This project uses pre-commit hooks to ensure code quality. The hooks run:

- Linting
- Formatting
- Tests

These checks run automatically when you commit changes.

### CI/CD

This project uses GitHub Actions for continuous integration and deployment:

- **CI Workflow**: Runs on push to main and pull requests to main

  - Builds all packages
  - Runs linting checks
  - Runs formatting checks
  - Runs tests

- **PR Workflow**: Additional checks for pull requests

  - Dependency review for security vulnerabilities

- **Auto-merge**: Automatically merges dependency updates after tests pass

## Packages

- [tml-parser](./packages/tml-parser): A parser for the Typed Markup Language
- [tml-vscode](./packages/tml-vscode): VS Code extension for TML syntax highlighting

## Development

This monorepo uses [Turborepo](https://turbo.build/repo) for managing the build process.

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Development mode
pnpm dev
```

## License

MIT
