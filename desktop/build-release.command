#!/bin/bash
# Double-click this file to build a signed + notarized Landed.dmg.
# Secrets are read from .release-secrets.local (gitignored — never committed).

set -euo pipefail
cd "$(dirname "$0")"

REPO_ROOT="$(cd .. && pwd)"
NODE_BIN="$REPO_ROOT/.tools/node-v22.14.0-darwin-arm64/bin"
if [[ -d "$NODE_BIN" ]]; then
  export PATH="$NODE_BIN:$PATH"
fi

if [[ ! -f .release-secrets.local ]]; then
  echo "Missing .release-secrets.local — add your app-specific password there first."
  read -r -p "Press Enter to close…"
  exit 1
fi

echo "Building Landed… (passwords stay on this Mac only)"
echo ""
echo "If macOS asks for Keychain access:"
echo "  → Enter YOUR MAC LOGIN PASSWORD (not the Apple app-specific password)"
echo "  → Click Always Allow"
echo ""

npm run package:mac:release

echo ""
echo "Done. If successful, open: $(pwd)/release/Landed.dmg"
read -r -p "Press Enter to close…"
