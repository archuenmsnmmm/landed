#!/usr/bin/env bash
# Enable Google OAuth on the linked Supabase project (see supabase/config.toml).
#
# Prerequisites:
#   1. Google Cloud → OAuth client → Authorized redirect URIs must include:
#      https://<project-ref>.supabase.co/auth/v1/callback
#   2. OAuth client ID (already in supabase/config.toml)
#   3. OAuth client secret from Google Cloud Console
#
# Usage:
#   ./scripts/setup-google-auth.sh
#   GOOGLE_CLIENT_SECRET=GOCSPX-... ./scripts/setup-google-auth.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="$(grep '^project_id' "$ROOT/supabase/config.toml" | sed 's/.*= *"\(.*\)".*/\1/')"
GOOGLE_CLIENT_ID="821453006387-snrakrrq6n17m5pde2nfshmnf8nanmc6.apps.googleusercontent.com"

if command -v supabase >/dev/null 2>&1; then
  SUPABASE=supabase
elif [[ -x "$ROOT/.tools/bin/supabase" ]]; then
  SUPABASE="$ROOT/.tools/bin/supabase"
else
  echo "Supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
  echo "Or download to $ROOT/.tools/bin/supabase"
  exit 1
fi

if ! "$SUPABASE" projects list >/dev/null 2>&1; then
  echo "Run: supabase login"
  exit 1
fi

SECRET="${GOOGLE_CLIENT_SECRET:-}"
if [[ -z "$SECRET" ]]; then
  read -rsp "Google OAuth client secret (GOCSPX-...): " SECRET
  echo
fi

if [[ -z "$SECRET" ]]; then
  echo "Client secret is required."
  exit 1
fi

cd "$ROOT"
"$SUPABASE" link --project-ref "$PROJECT_REF" 2>/dev/null || true
"$SUPABASE" secrets set "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=$SECRET"
"$SUPABASE" config push

echo ""
echo "Google auth configured for project $PROJECT_REF"
echo "  Client ID: $GOOGLE_CLIENT_ID"
echo "  Redirect (Google Cloud): https://$PROJECT_REF.supabase.co/auth/v1/callback"
echo "  Redirect (desktop app):  landed://auth/callback (via web bridge at /auth/callback)"
echo ""
echo "IMPORTANT: If sign-in shows redirect_uri_mismatch, add the Google Cloud"
echo "redirect URI above (exact URL). Run: ./scripts/fix-google-oauth-redirect.sh --open"
echo ""
echo "Verify: curl -s \"https://$PROJECT_REF.supabase.co/auth/v1/settings\" \\"
echo "  -H \"apikey: \$VITE_SUPABASE_ANON_KEY\" | grep google"
