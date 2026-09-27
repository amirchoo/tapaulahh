# Tapaulahh

> Map-first website for finding **pasar malam** (night markets) in Malaysia and the stalls at each one, plus **Kedai Rumah**, a section where home-based businesses show their catalog.

"Tapau" is Malaysian slang for takeaway. Tapaulahh is a sister product to **Bolahh** (futsal booking), from the same company.

- **Domain:** [tapaulahh.com](https://tapaulahh.com) (not live yet)
- **Launch area:** Shah Alam and the Klang Valley, then wider
- **Languages:** Bahasa Melayu (default) and English
- **Status:** Phase 1 in progress (see [Roadmap](#roadmap))

The full product brief is in [`VISION.md`](VISION.md) and the build order is in [`BUILD_PLAN.md`](BUILD_PLAN.md). Read those before making product decisions.

---

## Contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Conventions](#conventions)
- [Design system](#design-system)
- [Data model](#data-model)
- [Roadmap](#roadmap)

---

## What it does

| Who                 | What they can do                                                                                | Login?           |
| ------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| Visitor             | Find pasar malam near them, see which days they run and whether they're open now, browse stalls | No               |
| Home business owner | Create a shop page with a catalog, WhatsApp and Instagram links                                 | Yes              |
| Pasar vendor        | Register a new stall or claim an existing one                                                   | Yes              |
| Admin               | Manage pasar data, approve businesses and stalls, handle reports                                | Yes (admin role) |

**Core rule:** everything public can be read without an account. Login is only for creating and managing content.

**Phase 1 (now):** pasar map, vendor info, Kedai Rumah catalog, optional accounts, admin moderation.
**Phase 2 (later, not in this repo yet):** riders, delivery ("tapau for me"), ordering.

---

## Tech stack

### Frontend

| Layer      | Choice                                                                     | Version   | Why                                                                     |
| ---------- | -------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| Framework  | [Next.js](https://nextjs.org) (App Router)                                 | 16.3      | SSR and SSG so pasar, vendor and business pages are indexable by Google |
| UI library | [React](https://react.dev)                                                 | 19.2      |                                                                         |
| Language   | [TypeScript](https://www.typescriptlang.org) (strict)                      | 5.9       | No `any`                                                                |
| Styling    | [Tailwind CSS](https://tailwindcss.com)                                    | 4.3       | Mobile-first, theme tokens as CSS variables                             |
| Components | [shadcn/ui](https://ui.shadcn.com) on [Radix UI](https://www.radix-ui.com) | Radix 1.6 | Accessible primitives, owned in `src/components/ui`                     |
| Icons      | [Lucide](https://lucide.dev)                                               | 1.48      |                                                                         |
| Theming    | [next-themes](https://github.com/pacocoursey/next-themes)                  | 0.4       | Light and dark, follows the system with a manual toggle                 |
| i18n       | [next-intl](https://next-intl.dev)                                         | 4.14      | BM with no URL prefix, English under `/en`                              |
| Font       | Plus Jakarta Sans (via `next/font`)                                        |           | Placeholder until branding is final                                     |

### Maps

| Layer          | Choice                                                              | Version | Why                                                            |
| -------------- | ------------------------------------------------------------------- | ------- | -------------------------------------------------------------- |
| Map renderer   | [MapLibre GL JS](https://maplibre.org)                              | 6.11    | Open source, no per-load billing                               |
| React bindings | [react-map-gl](https://visgl.github.io/react-map-gl/) (`/maplibre`) | 8.1     |                                                                |
| Tiles          | [OpenFreeMap](https://openfreemap.org)                              |         | Free, no API key. `positron` (light) and `fiord` (dark) styles |
| Location       | Browser Geolocation API                                             |         | "Near me" is optional; the map works without it                |

No Google Maps. It bills per map load.

### Backend (from Part 2)

| Layer       | Choice                                                               | Why                                            |
| ----------- | -------------------------------------------------------------------- | ---------------------------------------------- |
| Database    | [Supabase](https://supabase.com) Postgres + **PostGIS**              | Geo queries such as "pasars near me"           |
| Auth        | Supabase Auth                                                        | Google sign-in and email magic link            |
| Storage     | Supabase Storage                                                     | Pasar and business photos                      |
| Security    | Row Level Security on every table                                    | Public reads only for approved rows            |
| Data access | [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side) | Server and browser clients, generated DB types |

It's a separate Supabase project from Bolahh, in the same organisation.

### Tooling and hosting

| Area       | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Linting    | ESLint 9 (`eslint-config-next`, `eslint-config-prettier`) |
| Formatting | Prettier 3 with `prettier-plugin-tailwindcss`             |
| Hosting    | [Vercel](https://vercel.com) (planned)                    |
| PWA        | `@serwist/next` or similar (planned, Part 9)              |
| Native app | Expo / React Native, reserved for Phase 2 riders only     |

**Why a website first:** visitors don't have to install anything, Google can index every pasar page, and it can still be installed to the home screen as a PWA.

---

## Architecture

```
                 ┌──────────────────────────── Browser ────────────────────────────┐
                 │  Next.js pages (server-rendered)  +  client islands:            │
                 │  map (MapLibre), toggles, filters                               │
                 │        │                               │                        │
                 │        │ tiles                         │ geolocation (optional) │
                 │        ▼                               │                        │
                 │  OpenFreeMap tile server               │                        │
                 └────────┬───────────────────────────────┴────────────────────────┘
                          │ HTTP
                 ┌────────▼────────────────────── Vercel ──────────────────────────┐
                 │  src/proxy.ts      locale routing (BM default, /en, cookie)     │
                 │  app/[locale]/…    server components fetch data                 │
                 └────────┬────────────────────────────────────────────────────────┘
                          │ @supabase/ssr (from Part 2)
                 ┌────────▼────────────────────── Supabase ────────────────────────┐
                 │  Postgres + PostGIS · RLS · Auth · Storage · RPCs               │
                 │  (pasars_near, search_all)                                      │
                 └─────────────────────────────────────────────────────────────────┘
```

- **Server components by default.** Client components only for the map and interactive UI.
- **Times use `Asia/Kuala_Lumpur`,** whatever time zone the device is in.
- **Home business locations are never exact.** Only a fuzzed point (~500 m) and the district are public.

---

## Project structure

```
.
├── messages/                  UI strings: ms.json (BM) and en.json (English)
├── public/vendor/             MapLibre worker, copied on install (git-ignored)
├── scripts/
│   └── copy-maplibre-worker.mjs
├── src/
│   ├── app/
│   │   ├── globals.css        Lampu Malam colour tokens (the only place for hex values)
│   │   └── [locale]/          All routes, BM at / and English at /en
│   │       ├── page.tsx       Pasar map (home)
│   │       ├── pasar/[slug]/[vendor]/
│   │       ├── kedai/[slug]/
│   │       ├── cari/  login/  akaun/kedai/  admin/
│   │       └── not-found.tsx
│   ├── components/
│   │   ├── layout/            SplitView (map pages), ContentPage, panels
│   │   ├── pasar/             Map, list, day chips, explorer
│   │   ├── shell/             Header, tab bars, theme and language toggles
│   │   └── ui/                shadcn/ui components
│   ├── i18n/                  next-intl routing, navigation, request config
│   ├── lib/pasar/             Types, schedule and status logic, data access
│   └── proxy.ts               Locale routing (Next.js 16's name for middleware)
├── VISION.md                  Product brief and decisions
└── BUILD_PLAN.md              Build order, Parts 1 to 9
```

### Routes

BM routes have no prefix; English mirrors them under `/en`.

| Route                    | Page                           |
| ------------------------ | ------------------------------ |
| `/`                      | Pasar map                      |
| `/pasar/[slug]`          | Pasar page                     |
| `/pasar/[slug]/[vendor]` | Vendor page                    |
| `/kedai`                 | Home business list and map     |
| `/kedai/[slug]`          | Business page                  |
| `/cari`                  | Search                         |
| `/login`                 | Log in                         |
| `/akaun`                 | My account and favourites      |
| `/akaun/kedai`           | Manage my business and catalog |
| `/admin/…`               | Admin area                     |

---

## Getting started

**You need:** Node.js 20 or newer, and npm.

```bash
git clone https://github.com/amirchoo/tapaulahh.git
cd tapaulahh
npm install                  # also copies the MapLibre worker into public/vendor
cp .env.example .env.local   # Supabase keys aren't needed until Part 2
npm run dev
```

Open <http://localhost:3000> for BM or <http://localhost:3000/en> for English.

To check the phone layout, use your browser's device mode at **375px** wide. The desktop layout starts at **1024px**.

---

## Environment variables

See [`.env.example`](.env.example).

| Variable                               | Where it's used                   | Notes                           |
| -------------------------------------- | --------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Metadata, sitemap, auth redirects | `http://localhost:3000` locally |
| `NEXT_PUBLIC_SUPABASE_URL`             | Browser and server                | From Part 2                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server                | From Part 2                     |
| `SUPABASE_SECRET_KEY`                  | Server only                       | Never expose to the browser     |

---

## Scripts

| Command                | What it does                       |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the dev server               |
| `npm run build`        | Production build                   |
| `npm start`            | Serve the production build         |
| `npm run lint`         | ESLint                             |
| `npm run typecheck`    | Generate route types and run `tsc` |
| `npm run format`       | Format everything with Prettier    |
| `npm run format:check` | Check formatting (use in CI)       |

---

## Conventions

- **Strict TypeScript, no `any`.**
- **No hardcoded UI text.** Every string goes in both `messages/ms.json` and `messages/en.json`. Copy is short, casual and in sentence case.
- **No hex colours in components.** Use the token utilities (`bg-pasar`, `text-pasar-text`, `bg-cta`, `text-kedai`, `text-open`, and so on).
- **Pages start with `initLocale(params)`** from `@/i18n/server`.
- **Schema changes go through `supabase/migrations/`,** then regenerate the types (from Part 2).
- **Build one part at a time** from `BUILD_PLAN.md`.

### Language choice

BM is the default for everyone. The browser's `Accept-Language` is deliberately ignored, because most Malaysian browsers report English. When someone switches language, the choice is saved in the `tapau_locale` cookie, and `src/proxy.ts` sends them to `/en` from then on.

### MapLibre worker

MapLibre 6 loads its tile worker as a separate file that bundlers don't copy. `scripts/copy-maplibre-worker.mjs` copies it into `public/vendor/maplibre-gl@<version>/` on `postinstall`, `predev` and `prebuild`. The map points at it with `setWorkerUrl()`.

---

## Design system

The **"Lampu Malam"** palette (night sky and warm stall lights) comes in light and dark versions. All text pairs pass WCAG AA.

| Token          | Light     | Dark      | Use                         |
| -------------- | --------- | --------- | --------------------------- |
| `--bg`         | `#FFF6E9` | `#12152B` | Page background             |
| `--card`       | `#FFFFFF` | `#1B1F3B` | Cards and bottom sheets     |
| `--border`     | `#EADFCC` | `#2E3355` | Hairlines                   |
| `--text`       | `#1B1F3B` | `#FFF6E9` | Main text                   |
| `--text-muted` | `#5A5F7A` | `#B8B6C9` | Secondary text              |
| `--pasar`      | `#F5A623` | `#F5A623` | Pasar pins and active chips |
| `--pasar-text` | `#8A5A00` | `#F5A623` | Amber used as text          |
| `--cta`        | `#C8431C` | `#FF6B45` | The one primary button      |
| `--open`       | `#2E7D3A` | `#4CC262` | "Open now" status only      |
| `--kedai`      | `#0B7A6E` | `#2EC4B6` | Kedai Rumah section         |

- **Pasar is amber and Kedai Rumah is teal,** so users always know which section they're in.
- **Phones come first:** design at 375px, with a bottom tab bar, a bottom sheet and 44px tap targets. Desktop has a top nav, a 400px left panel and the map on the right.

---

## Data model

This is a draft; the migrations in Part 2 are the final version. Geo columns use PostGIS `geography`.

| Table               | Purpose                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| `profiles`          | User profile and role (`user` / `admin`)                                     |
| `pasars`            | Pasar name, slug, location point, optional boundary polygon, address, status |
| `pasar_schedules`   | Days and hours; one pasar can run on several days                            |
| `vendor_categories` | Stall categories (BM and English names)                                      |
| `vendors`           | Stalls at a pasar; can be claimed by an owner; moderated                     |
| `vendor_claims`     | Requests to claim an existing stall                                          |
| `home_businesses`   | Kedai Rumah shops, public location fuzzed; moderated                         |
| `catalog_items`     | Products for a shop                                                          |
| `favourites`        | Saved pasars, vendors and businesses                                         |
| `reports`           | "Wrong info" reports for admins to review                                    |

RPCs: `pasars_near(lat, lng, radius_m, day_of_week)` and `search_all(query)`.

---

## Roadmap

| Part | Scope                                                                    | Status                   |
| ---- | ------------------------------------------------------------------------ | ------------------------ |
| 1    | Foundation: Next.js, theme, i18n, responsive shell, placeholder routes   | ✅ Done                  |
| 2    | Supabase schema, RLS, RPCs, seed data, typed clients                     | ⏳ Next                  |
| 3    | Pasar map: markers, clustering, day chips, open status, near me          | ✅ Done (on sample data) |
| 4    | Pasar detail sheet and panel, vendor list, SSR pasar and vendor pages    | ⬜                       |
| 5    | Auth (Google and magic link), account, favourites                        | ⬜                       |
| 6    | Kedai Rumah: list, map, business page, owner catalog management          | ⬜                       |
| 7    | Vendor register and claim, "report wrong info"                           | ⬜                       |
| 8    | Admin: pasar CRUD and moderation queues                                  | ⬜                       |
| 9    | Search, SEO (sitemap, OG images, hreflang), PWA, deploy to tapaulahh.com | ⬜                       |

Part 3 was built before Part 2 using temporary sample data in `src/lib/pasar/sample-data.ts`. **Its days, hours and coordinates haven't been verified.** Part 2 replaces it with Supabase.

**Not in Phase 1:** riders and delivery, online ordering, payments, reviews, chat, a native app.

---

## Licence

Proprietary. All rights reserved.
