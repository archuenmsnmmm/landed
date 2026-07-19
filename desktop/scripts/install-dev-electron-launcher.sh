#!/bin/bash
# Wrap the dev Electron binary so Finder launches start Landed dev instead of default_app.asar.
set -euo pipefail

APP_MACOS="$1"
REAL="$APP_MACOS/Electron.real"
WRAPPER="$APP_MACOS/Electron"

if [ ! -f "$REAL" ]; then
  mv "$WRAPPER" "$REAL"
fi

cat > "$WRAPPER" <<'EOF'
#!/bin/bash
set -euo pipefail
APP_MACOS="$(cd "$(dirname "$0")" && pwd)"
REAL="$APP_MACOS/Electron.real"

if [ -n "${ELECTRON_RENDERER_URL:-}" ] || [ -n "${ELECTRON_RUN_AS_NODE:-}" ]; then
  exec "$REAL" "$@"
fi

DESKTOP_ROOT="$(cd "$APP_MACOS/../../../.." && pwd)"
if [ ! -f "$DESKTOP_ROOT/package.json" ]; then
  osascript -e 'display alert "Landed dev app is misconfigured." message "Could not find desktop/package.json." as critical'
  exit 1
fi

if lsof -i :5173 -sTCP:LISTEN >/dev/null 2>&1; then
  osascript -e 'tell application id "com.landed.app.dev" to activate' 2>/dev/null \
    || osascript -e 'display notification "Landed dev is already running." with title "Landed"'
  exit 0
fi

osascript -e 'display notification "Starting Landed dev server…" with title "Landed"'
cd "$DESKTOP_ROOT"
exec npm run dev
EOF

chmod +x "$WRAPPER" "$REAL"
