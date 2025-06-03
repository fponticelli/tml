# Package Manager Configuration

This document outlines the package manager setup for the TML monorepo.

## Package Manager: Yarn v1

This project **exclusively uses Yarn v1.22.22** as the package manager. Other package managers (npm, pnpm, bun) are explicitly blocked.

### Enforcement Mechanisms

1. **`packageManager` field**: Specified in root `package.json`
2. **`preinstall` script**: Uses `only-allow` to block other package managers
3. **`.yarnrc` configuration**: Optimized Yarn settings
4. **CI/CD workflows**: All use Yarn commands
5. **Documentation**: All examples use Yarn

### Configuration Files

#### `.yarnrc`

```
# Enable workspaces support
workspaces-experimental true

# Improve performance and security
network-timeout 300000
registry "https://registry.npmjs.org/"
save-exact true

# Disable telemetry
disable-self-update-check true
```

#### `.nvmrc`

```
22
```

### Available Scripts

#### Root Level

- `yarn install` - Install all dependencies
- `yarn build` - Build all packages
- `yarn test` - Run all tests
- `yarn lint` - Lint all packages
- `yarn format` - Check formatting
- `yarn clean` - Remove build artifacts and node_modules
- `yarn reset` - Clean + fresh install

#### Package Level

Each package includes:

- `yarn build` - Build the package
- `yarn test` - Run package tests
- `yarn lint` - Lint package code
- `yarn clean` - Remove package build artifacts

### Workspaces

The monorepo uses Yarn workspaces to manage dependencies across packages:

```json
{
  "workspaces": ["packages/*"]
}
```

### Package Manager Enforcement

If you try to use npm, pnpm, or bun, you'll see:

```
╔═════════════════════════════════════════════════════════════╗
║                                                             ║
║   Use "yarn" for installation in this project.              ║
║                                                             ║
║   If you don't have Yarn, install it via "npm i -g yarn".   ║
║   For more details, go to https://yarnpkg.com/              ║
║                                                             ║
╚═════════════════════════════════════════════════════════════╝
```

### Pre-commit Hooks

The repository includes pre-commit hooks that run:

- Linting (`yarn lint`)
- Format checking (`yarn format`)
- Tests (`yarn test`)

These hooks are configured to work from VS Code and other editors by automatically setting up the correct PATH environment.

### CI/CD Integration

All GitHub Actions workflows use Yarn:

- Yarn cache setup
- `yarn install --frozen-lockfile`
- Yarn commands for build, test, lint

### Troubleshooting

#### Pre-commit Hooks in VS Code

If pre-commit hooks fail with "yarn not found" when committing from VS Code:

1. **Automatic Fix**: The hooks now include environment setup that should resolve PATH issues automatically.

2. **Manual Fix**: If issues persist, ensure yarn is in your system PATH:

   ```bash
   # Check if yarn is available
   which yarn

   # Add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
   export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
   ```

3. **VS Code Settings**: Add to VS Code settings.json:
   ```json
   {
     "terminal.integrated.env.osx": {
       "PATH": "/usr/local/bin:/opt/homebrew/bin:${env:PATH}"
     }
   }
   ```

#### Lock File Conflicts

If you see warnings about `package-lock.json`, remove it:

```bash
rm package-lock.json
```

#### Cache Issues

Clear Yarn cache:

```bash
yarn cache clean
```

#### Fresh Start

Reset everything:

```bash
yarn reset
```
