# Tapaulahh — Build Plan (Phase 1)

Read `VISION.md` first. Build **one part at a time**. At the end of each part: make sure it runs, summarise what was built, list anything unfinished, then **stop**. Don't start the next part until asked.

---

## Part 1 — Foundation

- Next.js (App Router) + TypeScript strict, Tailwind, shadcn/ui, ESLint + Prettier
- Theme: Lampu Malam CSS variable tokens (light + dark) from VISION §9, `next-themes`, system default + manual toggle
- i18n: next-intl, BM default (no prefix) + `/en`, `messages/ms.json` + `messages/en.json`
- Responsive app shell (VISION §9): **mobile** = compact header + bottom tab bar (Pasar | Kedai Rumah | Cari | Akaun); **desktop** = top nav with wordmark "tapaulahh", tabs, theme + language toggles, and a left side panel + main area layout
- Placeholder pages for every route in VISION §8
- `.env.example` with Supabase keys (not connected yet)

**Done when:** app runs, tabs navigate, theme and language switch and persist, looks right at 375px (mobile) and 1440px (desktop).

## Part 2 — Supabase schema

- Supabase CLI in repo, PostGIS enabled
- Migrations for all tables in VISION §6, RLS policies from §7, storage buckets
- `pasars_near` and `search_all` RPCs
- Seed: 5–8 real Shah Alam pasars with schedules + sample vendors
- Generate TypeScript types, set up `@supabase/ssr` server + browser clients

**Done when:** `supabase db reset` works, anon can read public rows and cannot write.

## Part 3 — Pasar map

- MapLibre full-screen map, tiles switch with theme
- Pasar markers with clustering, "Hari ini" default + day chips
- Open now / later / closed status (Asia/Kuala_Lumpur)
- "Near me" (optional geolocation)

**Done when:** seeded pasars show, day filter and status are correct.

## Part 4 — Pasar detail + public pages

- Tap marker → fly to pasar, show outline, bottom sheet (mobile) / side panel (desktop)
- Vendor list grouped by category, vendor detail
- SSR pages `/pasar/[slug]` and `/pasar/[slug]/[vendor]` with metadata (BM + EN)

**Done when:** every pasar and vendor has a shareable, indexable page.

## Part 5 — Auth + account

- Google sign-in + email magic link, `profiles` auto-created
- `/login`, `/akaun`, favourites (save/unsave pasar, vendor, business)
- Browsing stays fully public

**Done when:** a user can sign in, favourite things, and sign out.

## Part 6 — Kedai Rumah

- `/kedai` list + map (fuzzed locations only), category/area filters
- `/kedai/[slug]` business page with catalog, WhatsApp + Instagram buttons
- `/akaun/kedai`: register business (→ pending), manage catalog, photo upload

**Done when:** a user can create a business + catalog; it appears publicly only after approval.

## Part 7 — Vendor register/claim + reports

- Logged-in users: register a new stall or claim an existing one (→ pending)
- "Report wrong info" on pasar/vendor/business pages, login required

**Done when:** claims, new stalls and reports all land in the database as pending/open.

## Part 8 — Admin

- `/admin` (admin role only): CRUD pasars, schedules, vendors
- Queues: pending businesses, vendors, claims, reports — approve/reject/resolve

**Done when:** everything from Parts 6–7 can be moderated from the admin area.

## Part 9 — Search, SEO, PWA, launch

- `/cari` search (pasar, area, food)
- Sitemap, robots, Open Graph images, hreflang for BM/EN
- PWA manifest + offline shell
- Deploy to Vercel on tapaulahh.com

**Done when:** live on tapaulahh.com, installable, pages show up correctly when shared.
