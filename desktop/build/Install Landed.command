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

# Unsigned CI builds ship with a broken linker signature; ad-hoc sign so Gatekeeper can open them.
if ! codesign --verify --deep --strict "$DEST" >/dev/null 2>&1; then
  if ! codesign -dvv "$DEST" 2>&1 | grep -q "Authority=Developer ID Application"; then
    echo "Applying ad-hoc signature..."
    FRAMEWORK="$DEST/Contents/Frameworks/Electron Framework.framework"
    [ -d "$FRAMEWORK" ] && codesign --force --sign - "$FRAMEWORK" 2>/dev/null || true
    for HELPER in "Electron Helper.app" "Landed Helper.app"; do
      HELPER_PATH="$DEST/Contents/Frameworks/$HELPER"
      [ -d "$HELPER_PATH" ] && codesign --force --sign - "$HELPER_PATH" 2>/dev/null || true
    done
    codesign --force --deep --sign - "$DEST"
  fi
fi

LAUNCHER="$HOME/Desktop/Open Landed.command"
cp "$DIR/Open Landed.command" "$LAUNCHER" 2>/dev/null || cp "$DIR/Install Landed.command" "$LAUNCHER"
chmod +x "$LAUNCHER" 2>/dev/null || true

echo "Opening Landed..."
open -a "$DEST"
osascript -e 'display notification "If macOS asks for confirmation, right-click Landed in Applications and choose Open once." with title "Landed installed"'
