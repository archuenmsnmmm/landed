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
# Signed + notarized Mac DMG (Keychain Developer ID or .p12)
npm run package:mac:release --prefix desktop
npm run sync-downloads && npm run upload-download

# Publish GitHub Release (repo: archuenmsnmmm/landed)
git tag v0.1.3 && git push origin v0.1.3
```

Windows installers ship from Desktop Release (`Landed-Setup.exe`) or local `npm run desktop:package:win`.

### GitHub Actions secrets (desktop release)

| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | Auth |
| `VITE_SUPABASE_ANON_KEY` | Auth |
| `VITE_GOOGLE_CLIENT_ID` | Google sign-in |
| `VITE_API_BASE_URL` | Billing API (`https://landed-ai.com`) |
| `VITE_LEGAL_BASE_URL` | Legal pages (`https://landed-ai.com`) |
| `MAC_CERT_P12_BASE64` | Developer ID cert (optional if building signed locally) |
| `MAC_CERT_PASSWORD` | Cert password |
| `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` | Notarization |

### Launch checklist

**Live (done)**

- [x] `https://landed-ai.com` on Vercel
- [x] Landed rebrand on `archuenmsnmmm/landed`
- [x] Mac + Windows Blob installers (`Landed.dmg`, `Landed-Setup.exe`)
- [x] `NEXT_PUBLIC_WINDOWS_AVAILABLE=true`
- [x] Free-question Supabase RPC + `free_questions_used`
- [x] AI disclaimer (“AI-powered… not human”) on site + Terms
- [x] Pricing API (`$24.99` / `$797`)

**Before each desktop ship**

- [ ] Bump `package.json` + `desktop/package.json` version
- [ ] Signed Mac DMG → `npm run upload-download`
- [ ] Tag release (e.g. `v0.1.3`) with `Landed.dmg` + `Landed-Setup.exe`
- [ ] Confirm `/api/download?platform=mac|windows` redirects to Blob

**Smoke test**

- [ ] Sign up (email + Google) → soft paywall → start session
- [ ] Ask about a problem on screen (Starter: 15 free questions, then hard paywall)
- [ ] Overlay shows AI disclaimer + Learn More
- [ ] Pro / Lifetime checkout + billing portal
- [ ] Overlay stays hidden from screen share on Pro

## Stack

- **Site:** Next.js 15, React 19, Tailwind CSS, Supabase, Stripe
- **Desktop:** Electron, React, Vite, Zustand, Tailwind CSS
