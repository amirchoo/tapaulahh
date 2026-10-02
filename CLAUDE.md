@AGENTS.md

# Tapaulahh

- The owner knows Bolahh (Vite + React Router + i18next + inline styles, JS). `docs/BOLAHH_TO_TAPAULAHH.md` maps it to this stack; explain new concepts in those terms and keep that doc current.
- Read `VISION.md` (product + tech decisions) and `BUILD_PLAN.md` (build order) first.
- Build one part at a time; stop and summarise at the end of each part.
- Next.js 16: middleware is `src/proxy.ts`; `params` are async.
- i18n: next-intl, BM (`ms`) default with no prefix, English under `/en` with translated paths (`pathnames` in `src/i18n/routing.ts`; folders use BM paths; "pasar"/"kedai" stay the same). New pages must be added to `pathnames`; links to dynamic routes use `{ pathname, params }`. Every UI string goes in both `messages/ms.json` and `messages/en.json`. Pages call `initLocale(params)` from `@/i18n/server`.
- Language choice is stored in the `tapau_locale` cookie (not Accept-Language); `src/proxy.ts` redirects unprefixed URLs to `/en` when it is `en`.
- Colours: only via tokens in `src/app/globals.css` (`bg-pasar`, `text-pasar-text`, `bg-cta`, `text-kedai`, `text-open`…). No hex in components.
- Layouts: `SplitView` (map pages: bottom sheet on mobile, 400px left panel on desktop ≥ lg) and `ContentPage` (single column).
- Map: MapLibre via `react-map-gl/maplibre`, OpenFreeMap tiles (positron light / fiord dark), no API key. MapLibre's worker is copied to `public/vendor/` by `scripts/copy-maplibre-worker.mjs` (postinstall/predev/prebuild) and set with `setWorkerUrl`.
- Pasar data currently comes from `src/lib/pasar/sample-data.ts` via `getPasars()` in `src/lib/pasar/queries.ts`; Part 2 swaps that for Supabase. Time logic in `src/lib/pasar/schedule.ts` (always Asia/Kuala_Lumpur).
- Git: commit and push to `dev` only; `main` gets merges from `dev` (ask the owner first). A teammate (Asyraf) also contributes.
- Supabase: cloud project `duteuggmjqbselwotfqf` ("Tapaulahh", Team Bolahh org), linked via CLI (no DB password needed). No local Docker yet. Schema only via `supabase/migrations/` → `npm run db:push` → `npm run db:types` → `npm run test:db`. Public reads use `createPublicClient()` (cookie-free, cached 300s, tag `public-data`); user-specific reads use `createClient()` from `@/lib/supabase/server`. No sample data in the DB.
- Auth: email code (+ link) and Google, no passwords; `/login` and `/daftar` share one flow. Server helpers in `src/lib/auth/` (`getCurrentUser`, `requireUser(locale, href)`, actions); email links and Google land on `src/app/auth/callback/route.ts` (outside `[locale]`, skipped by the proxy). Only account pages read the session; public pages stay static. Dashboard setup in `docs/AUTH_SETUP.md`.
- Deploy: Vercel project `tapaulahh`, `main` = production (tapaulahh.vercel.app), `dev` = previews, region sin1 (`vercel.json`). Vercel env has only the two NEXT_PUBLIC Supabase vars. Site is noindexed via `ALLOW_SEARCH_INDEXING` in `next.config.ts` until Part 9. Local secrets live in `.env` (git-ignored).
- Checks: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`.
