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
open -a "$APP"
