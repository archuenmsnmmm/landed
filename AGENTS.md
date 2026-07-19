# Landed — agent instructions

Monorepo: **Next.js marketing site + API** (repo root) and **Electron desktop app** (`desktop/`).

## Repository layout

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages and `/api/*` routes |
| `src/components/` | Marketing site React components |
| `src/lib/` | Shared server utilities (Stripe, Supabase, OpenAI, entitlements) |
| `desktop/src/main/` | Electron main process |
| `desktop/src/renderer/` | Desktop React UI (dashboard, overlay, onboarding, paywall) |
| `desktop/src/preload/` | Electron preload bridge |
| `supabase/migrations/` | Database migrations |

## Common commands

```bash
# Site (root)
npm install
npm run dev          # http://localhost:3000
npm run build
npm run lint

# Desktop (also run npm install --prefix desktop after root install)
npm run desktop:dev  # from root, or: cd desktop && npm run dev
npm run desktop:build
```

Do **not** run `desktop:package`, `deploy:prod`, or Mac signing/notarization from cloud agents unless explicitly asked — they need local secrets and macOS tooling.

## What to edit where

- **Marketing site, pricing, download page** → `src/app/`, `src/components/`
- **API routes** (billing, AI, knowledge) → `src/app/api/`
- **Desktop UI / overlay / onboarding** → `desktop/src/renderer/src/`
- **Desktop Electron behavior** → `desktop/src/main/`, `desktop/src/preload/`

## Cursor Cloud specific instructions

Cloud agents run on Linux without Electron GUI. Use these defaults:

1. After clone, dependencies are installed via `.cursor/environment.json` (`npm install` in root and `desktop/`).
2. For site/API work, run `npm run dev` and verify with `npm run build` and `npm run lint`.
3. For desktop renderer changes, run `npm run desktop:build` to typecheck/bundle; full Electron runtime cannot be tested in cloud.
4. Copy env var **names** from `.env.example` and `desktop/.env.example`. Values live in the [Cursor Cloud Agents secrets dashboard](https://cursor.com/dashboard/cloud-agents) — never commit `.env` files.
5. Supabase migrations: `npx supabase db push` only when the user asks and Supabase CLI auth is available.

### Minimum secrets for site dev/build

Set these in Cursor Cloud secrets (from root `.env.example`):

- `OPENAI_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (use `http://localhost:3000` for local dev)
- Stripe keys if touching billing routes

### Desktop renderer work

Desktop uses Vite env vars (`VITE_*` in `desktop/.env.example`). Production desktop calls authenticated `/api/*` routes on the site — prefer changing shared logic in `src/lib/` or API routes when possible.

## Conventions

- TypeScript throughout; match existing patterns in neighboring files.
- Keep changes scoped — site vs desktop vs API.
- API routes use `requireAuth` / `src/lib/api-auth.ts` for protected endpoints.
- Billing and entitlements: `src/lib/entitlements.ts`, `src/lib/stripe-config.ts`.
