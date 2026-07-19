#!/bin/bash
# Push GitHub Actions workflows (requires workflow scope on gh token).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS_BIN="$ROOT/.tools/bin"
NODE_BIN="$ROOT/.tools/node-v22.14.0-darwin-arm64/bin"
export PATH="$NODE_BIN:$TOOLS_BIN:$PATH"

if ! gh auth status 2>&1 | grep -q workflow; then
  echo "GitHub token needs workflow scope. Opening device login…"
  gh auth refresh -h github.com -s workflow,repo
fi

cd "$ROOT"
git add .github/
git diff --cached --quiet && echo "Workflows already committed." || \
  git commit -m "Add CI and desktop release GitHub Actions workflows."
git push origin main
echo "Workflows pushed."
