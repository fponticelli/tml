#!/usr/bin/env sh

# Setup environment for Husky hooks
# This ensures we can find yarn, node, and other tools from VS Code and other editors

# Common paths where tools might be installed
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

# Add common Node.js installation paths
export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
export PATH="/usr/local/share/npm/bin:$PATH"

# Load nvm if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

# Load fnm if available
if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --use-on-cd)"
fi

# Use the correct node version if .nvmrc exists
if [ -f ".nvmrc" ]; then
  if command -v nvm >/dev/null 2>&1; then
    nvm use
  elif command -v fnm >/dev/null 2>&1; then
    fnm use
  fi
fi

# Verify yarn is available
if ! command -v yarn >/dev/null 2>&1; then
  echo "Error: yarn not found in PATH"
  echo "Current PATH: $PATH"
  echo "Please ensure yarn is installed and available in your PATH"
  exit 1
fi

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Are you in the project root?"
  exit 1
fi
