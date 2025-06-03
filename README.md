# TML Monorepo

This is a monorepo for the Typed Markup Language (TML) ecosystem.

## Development Workflow

This project uses pre-commit hooks to ensure code quality. The hooks run:

- Linting (`yarn lint`)
- Formatting (`yarn format`)
- Tests (`yarn test`)

These checks run automatically when you commit changes. The hooks are configured to work from VS Code and other editors by automatically setting up the correct PATH environment.

**Note**: If you experience "yarn not found" errors when committing from VS Code, see the [Package Manager Documentation](./docs/package-manager.md#troubleshooting) for solutions.

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

- [@typedml/parser](./packages/tml-parser): A parser for the Typed Markup Language
- [@typedml/utils](./packages/tml-utils): Utility functions for working with TML nodes
- [tml-vscode](./packages/tml-vscode): VS Code extension for TML syntax highlighting

## Development

This monorepo uses [Turborepo](https://turbo.build/repo) for managing the build process and **Yarn v1** as the package manager.

### Prerequisites

- Node.js 22.x (see `.nvmrc`)
- Yarn v1.22.22 (enforced via `packageManager` field)

### Setup

```bash
# Install dependencies (Yarn is enforced - npm/pnpm will be rejected)
yarn install

# Build all packages
yarn build

# Run tests
yarn test

# Development mode
yarn dev

# Lint and format
yarn lint
yarn format

# Clean and reset
yarn clean    # Remove all build artifacts and node_modules
yarn reset    # Clean + fresh install
```

## License

MIT
