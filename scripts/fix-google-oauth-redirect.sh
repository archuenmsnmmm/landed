#!/usr/bin/env bash
# Fix Google OAuth "Error 400: redirect_uri_mismatch" for Landed desktop sign-in.
#
# Supabase always sends this redirect_uri to Google (not landed://auth/callback):
#   https://<project-ref>.supabase.co/auth/v1/callback
#
# Add that exact URL in Google Cloud → APIs & Services → Credentials → your
# OAuth 2.0 Web client → Authorized redirect URIs.
#
# Usage:
#   ./scripts/fix-google-oauth-redirect.sh
#   ./scripts/fix-google-oauth-redirect.sh --open   # also open Google Cloud Console

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="$(grep '^project_id' "$ROOT/supabase/config.toml" | sed 's/.*= *"\(.*\)".*/\1/')"
GOOGLE_CLIENT_ID="821453006387-snrakrrq6n17m5pde2nfshmnf8nanmc6.apps.googleusercontent.com"
REDIRECT_URI="https://${PROJECT_REF}.supabase.co/auth/v1/callback"
OPEN_CONSOLE=false

for arg in "$@"; do
  case "$arg" in
    --open) OPEN_CONSOLE=true ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
  esac
done

echo "Landed Google OAuth redirect fix"
echo "================================"
echo ""
echo "Client ID:"
echo "  $GOOGLE_CLIENT_ID"
echo ""
echo "Add this Authorized redirect URI (exact match, no trailing slash):"
echo "  $REDIRECT_URI"
echo ""
echo "Google Cloud steps:"
echo "  1. Open APIs & Services → Credentials"
echo "  2. Edit OAuth 2.0 Client ID (type must be Web application, not Desktop)"
echo "  3. Under Authorized redirect URIs, add the URL above"
echo "  4. Save"
echo ""
echo "Do NOT add landed://auth/callback to Google — that URI is only for Supabase"
echo "(Auth → URL Configuration → Redirect URLs)."
echo ""

if command -v supabase >/dev/null 2>&1; then
  SUPABASE=supabase
elif [[ -x "$ROOT/.tools/bin/supabase" ]]; then
  SUPABASE="$ROOT/.tools/bin/supabase"
else
  SUPABASE=""
fi

if [[ -n "$SUPABASE" ]]; then
  ANON_KEY=""
  if [[ -f "$ROOT/desktop/.env" ]]; then
    ANON_KEY="$(grep -E '^VITE_SUPABASE_ANON_KEY=' "$ROOT/desktop/.env" | cut -d= -f2- | tr -d '"' | tr -d "'")"
  fi
  if [[ -z "$ANON_KEY" && -f "$ROOT/.env" ]]; then
    ANON_KEY="$(grep -E '^VITE_SUPABASE_ANON_KEY=' "$ROOT/.env" | cut -d= -f2- | tr -d '"' | tr -d "'")"
  fi
  if [[ -n "$ANON_KEY" ]]; then
    GOOGLE_ENABLED="$(curl -fsS "https://${PROJECT_REF}.supabase.co/auth/v1/settings" \
      -H "apikey: $ANON_KEY" | grep -o '"google":true' || true)"
    if [[ -n "$GOOGLE_ENABLED" ]]; then
      echo "Supabase: Google provider is enabled on $PROJECT_REF"
    else
      echo "Supabase: Google provider is NOT enabled yet."
      echo "  Run: GOOGLE_CLIENT_SECRET=GOCSPX-... ./scripts/setup-google-auth.sh"
    fi
    echo ""
  fi
fi

echo "After saving in Google Cloud, retry sign-in in the Landed app."
echo ""

if [[ "$OPEN_CONSOLE" == true ]]; then
  CONSOLE_URL="https://console.cloud.google.com/apis/credentials/oauthclient/${GOOGLE_CLIENT_ID}?project=821453006387"
  echo "Opening Google Cloud Console..."
  if command -v open >/dev/null 2>&1; then
    open "$CONSOLE_URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$CONSOLE_URL"
  else
    echo "$CONSOLE_URL"
  fi
fi
