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

- [@typedml/parser](./packages/tml-parser): A parser for the Typed Markup Language
- [@typedml/utils](./packages/tml-utils): Utility functions for working with TML nodes
- [tml-vscode](./packages/tml-vscode): VS Code extension for TML syntax highlighting

## Development

This monorepo uses [Turborepo](https://turbo.build/repo) for managing the build process.

### Setup

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Run tests
yarn test

# Development mode
yarn dev
```

## License

MIT
