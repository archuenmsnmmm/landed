#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$DIR/Landed.app"
DEST="/Applications/Landed.app"

if [ ! -d "$APP" ]; then
  osascript -e 'display alert "Landed.app not found in this folder." as warning'
  exit 1
fi

echo "Installing Landed..."
# Clear quarantine flags only — do not re-sign; notarized builds stay valid.
xattr -cr "$APP" 2>/dev/null || true
rm -rf "$DEST"
ditto "$APP" "$DEST"
xattr -cr "$DEST" 2>/dev/null || true

LAUNCHER="$HOME/Desktop/Open Landed.command"
cp "$DIR/Open Landed.command" "$LAUNCHER" 2>/dev/null || cp "$DIR/Install Landed.command" "$LAUNCHER"
chmod +x "$LAUNCHER" 2>/dev/null || true

echo "Opening Landed..."
open -a "$DEST"
osascript -e 'display notification "If macOS asks for confirmation, right-click Landed in Applications and choose Open once." with title "Landed installed"'
