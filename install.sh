#!/usr/bin/env bash
set -euo pipefail

# Byreal CLI installer
# Usage: curl -fsSL https://raw.githubusercontent.com/byreal-git/byreal-cli/main/install.sh | bash

REPO_URL="https://github.com/byreal-git/byreal-cli/releases/latest/download/byreal-cli.tgz"
MIN_NODE_VERSION=18

echo "Installing Byreal CLI..."

# Check Node.js is installed
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is not installed."
  echo "Please install Node.js >= ${MIN_NODE_VERSION} from https://nodejs.org"
  exit 1
fi

# Check Node.js version >= 18
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt "$MIN_NODE_VERSION" ]; then
  echo "Error: Node.js >= ${MIN_NODE_VERSION} is required (found v$(node -v))."
  echo "Please upgrade from https://nodejs.org"
  exit 1
fi

# Install via npm
echo "Installing from GitHub Releases..."
npm install -g "$REPO_URL"

# Verify installation
if ! command -v byreal-cli &>/dev/null; then
  echo "Error: Installation failed. byreal-cli not found in PATH."
  exit 1
fi

echo ""
echo "Byreal CLI $(byreal-cli --version) installed successfully!"
echo ""
echo "Next steps:"
echo "  byreal-cli setup    # Configure your wallet"
echo "  byreal-cli --help   # See all commands"
