#!/bin/bash
# Double-click to open Landed (clears quarantine only — preserves notarization).
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALLED="/Applications/Landed.app"
LOCAL="$DIR/Landed.app"
DEV_APP="$(cd "$DIR/../.landed-dev" 2>/dev/null && pwd)/Landed.app"

if [ -d "$INSTALLED" ]; then
  APP="$INSTALLED"
elif [ -d "$LOCAL" ]; then
  APP="$LOCAL"
elif [ -d "$DEV_APP" ]; then
  open "$DEV_APP"
  exit 0
else
  osascript -e 'display alert "Landed.app not found. Run Install Landed.command in this folder, or drag Landed to Applications." as warning'
  exit 1
fi

# Dev Electron uses the same app name and can block the installed build.
pkill -f "desktop/.landed-dev/Landed" 2>/dev/null || pkill -f "desktop/.landed-dev/Electron" 2>/dev/null || true
sleep 0.3

xattr -cr "$APP" 2>/dev/null || true

# Unsigned CI builds ship with a broken linker signature; ad-hoc sign so Gatekeeper can open them.
if ! codesign --verify --deep --strict "$APP" >/dev/null 2>&1; then
  if ! codesign -dvv "$APP" 2>&1 | grep -q "Authority=Developer ID Application"; then
    FRAMEWORK="$APP/Contents/Frameworks/Electron Framework.framework"
    [ -d "$FRAMEWORK" ] && codesign --force --sign - "$FRAMEWORK" 2>/dev/null || true
    for HELPER in "Electron Helper.app" "Landed Helper.app"; do
      HELPER_PATH="$APP/Contents/Frameworks/$HELPER"
      [ -d "$HELPER_PATH" ] && codesign --force --sign - "$HELPER_PATH" 2>/dev/null || true
    done
    codesign --force --deep --sign - "$APP"
  fi
fi

open -a "$APP"
