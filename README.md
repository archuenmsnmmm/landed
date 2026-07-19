# Landed — AI that sees your screen (desktop app + marketing site)

## What it does

Landed is a **desktop application** that sees your screen so you can ask questions in text:

- **Ask overlay** — type about what’s on screen; no mic needed
- **Settings & billing** — overlay display, Starter / Pro / Lifetime
- **Hide from screen share** — Pro keeps the overlay private when you share

## Marketing site

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Deploy production:

```bash
npm run deploy:prod
```

## Desktop app

```bash
cd desktop
cp .env.example .env   # fill in keys
npm install
npm run dev
```

Or from the repo root: `npm run desktop:dev`

### Onboarding flow

| Step | Screen |
|------|--------|
| 1 | Welcome |
| 2 | Auth (email or Google via Supabase) |
| 3 | Soft paywall (continue free → settings) |
| 4 | Hard paywall after 15 free AI questions |

### Overlay shortcuts

- `⌘ Enter` — Assist
- `⌘ R` — Clear session
- `⌘ ← →` — Move overlay
- `⌘ \` — Hide / show

## Environment

Copy `.env.example` → `.env` at the repo root and `desktop/.env.example` → `desktop/.env`.

Required for production:

- **OpenAI** — `OPENAI_API_KEY` on the site/API only. Desktop production calls authenticated `/api/*` routes (do **not** bake `VITE_OPENAI_API_KEY` into releases; it is local-dev only).
- **Supabase** — URL, anon key, service role; run `supabase db push`
- **Stripe** — live secret key, webhook secret, and price IDs on Vercel
- **Google OAuth** — see comments in `.env.example`

## Release

```bash
# Build + install locally (Mac)
npm run local:setup

# Publish installers to GitHub Releases (repo: archuenmsnmmm/landed)
git tag v0.1.2 && git push origin v0.1.2
```

Signed Mac builds: `desktop/build-release.command` (requires `desktop/.release-secrets.local`).

Windows installers ship from the same Desktop Release workflow (`Landed-Setup.exe`). Until that asset is published and `NEXT_PUBLIC_WINDOWS_AVAILABLE=true` is set on Vercel, the site shows **Windows soon**.

### GitHub Actions secrets (desktop release)

Configure these in **Settings → Secrets and variables → Actions** before tagging a release:

| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | Auth |
| `VITE_SUPABASE_ANON_KEY` | Auth |
| `VITE_GOOGLE_CLIENT_ID` | Google sign-in |
| `VITE_API_BASE_URL` | Billing API (default: `https://landed-ai.com`) |
| `VITE_LEGAL_BASE_URL` | Legal pages (default: `https://landed-ai.com`) |
| `MAC_CERT_P12_BASE64` | Developer ID cert (base64) for signed Mac builds |
| `MAC_CERT_PASSWORD` | Cert password |
| `APPLE_ID` | Apple ID for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Apple Team ID |

Without the Mac signing secrets, CI still builds a DMG but it will be **unsigned** (Gatekeeper blocks it).

### Launch checklist

**Domain + DNS**

- [x] `landed-ai.com` on Vercel
- [ ] Confirm `https://landed-ai.com` and `https://www.landed-ai.com` serve the site
- [ ] Confirm `https://landed-ai.com/api/stripe/status` responds with admin secret (`ADMIN_STATUS_SECRET`)

**Vercel (site + API)**

- [ ] Set all root `.env` vars on Vercel (OpenAI, Supabase, Stripe **live** keys + price IDs)
- [ ] `NEXT_PUBLIC_SITE_URL=https://landed-ai.com`
- [ ] `NEXT_PUBLIC_APP_URL=https://landed-ai.com`
- [ ] `GITHUB_RELEASE_REPO=archuenmsnmmm/landed` (optional; this is the default)
- [ ] Stripe webhook → `https://landed-ai.com/api/webhooks/stripe` (live mode)
- [ ] Deploy (`npm run deploy:prod` or push to `main` if connected)
- [ ] Verify `/download`, `/pricing`, `/app`, and legal pages load on production
- [ ] Mac download redirects to notarized `Landed.dmg` on Blob
- [ ] Leave Windows off until ready; then set `NEXT_PUBLIC_WINDOWS_AVAILABLE=true` (+ Blob URL)

**Supabase**

- [ ] `supabase db push` — includes free-question migrations (`202607180001_*`, `202607180002_*`)
- [ ] Site URL: `https://landed-ai.com`
- [ ] Google OAuth redirect: `https://<project>.supabase.co/auth/v1/callback`
- [ ] Redirect URLs include `http://127.0.0.1:42817/auth/callback` (desktop), `https://landed-ai.com/auth/callback`, `https://landed-ai.com/**`, `landed://auth/callback`

**Desktop**

- [ ] Set GitHub Actions `VITE_*` secrets to production values (`https://landed-ai.com`)
- [ ] Set Mac signing + notarization secrets (table above)
- [ ] Fill `desktop/.env` with production `VITE_*` keys
- [ ] Commit + push the Landed rebrand to `main`
- [ ] Tag a new release (e.g. `v0.1.2`) to trigger **Desktop Release** → `Landed.dmg` (+ `Landed-Setup.exe`)
- [ ] Upload notarized Mac DMG: `npm run sync-downloads && npm run upload-download`
- [ ] Test download buttons on the marketing site

**Smoke test**

- [ ] Sign up (email + Google) → soft paywall → settings / start session
- [ ] Ask about a problem on screen (Starter: 15 free questions, then hard paywall)
- [ ] Pro / Lifetime checkout + billing portal
- [ ] Overlay stays hidden from screen share on Pro
- [ ] Sitemap / OG URLs show `https://landed-ai.com`

## Stack

- **Site:** Next.js 15, React 19, Tailwind CSS, Supabase, Stripe
- **Desktop:** Electron, React, Vite, Zustand, Tailwind CSS
