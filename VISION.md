# Tapaulahh — Project Vision (Phase 1)

> Read this first. It describes what Tapaulahh is, what Phase 1 includes, and the technical decisions already made. Anything under "Open questions" is not decided yet — ask before assuming.

## 1. What Tapaulahh is

A map-first website for discovering **pasar malam** (night markets) in Malaysia and the **vendors** at each one, plus a separate section where **home-based small businesses** showcase their catalog.

- Sister product to **Bolahh** (futsal booking platform), same company, same founder/developer.
- Name: "tapau" = takeaway in Malaysian slang. Brand voice is casual, local, Manglish/BM-friendly.
- Launch area: **Shah Alam / Klang Valley** first, then expand.
- Domain: **tapaulahh.com**
- Languages: **Bahasa Melayu (default) + English**, user can switch.

## 2. Phases

| Phase       | Scope                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------- |
| **1 (now)** | Pasar malam map + vendor info, home business catalog, optional accounts, admin moderation |
| 2 (later)   | Riders / delivery ("tapau for me"), ordering, likely a native app for riders              |

**Do not build Phase 2 features.** But keep the data model friendly to it (e.g. vendors and businesses can later receive orders; users have accounts).

## 3. Users

| User                | Needs                                                             | Login required?  |
| ------------------- | ----------------------------------------------------------------- | ---------------- |
| Visitor             | Find pasar malam near them, see which day it runs, browse vendors | **No**           |
| Home business owner | Create and manage a shop page + catalog                           | Yes              |
| Pasar vendor        | Register a new stall or claim an existing one, edit its info      | Yes              |
| Admin (founder)     | Add/edit pasar data, approve businesses, handle reports           | Yes (admin role) |

**Core rule: all public info is readable without an account.** Login is only for creating/managing content (and later, Phase 2 riders/ordering).

## 4. Core features (Phase 1)

### 4.1 Pasar map (main screen)

- Full-screen map, pasar markers clustered when zoomed out.
- Default filter: **"Hari ini"** (pasar operating today). Chips for each day of the week.
- Marker status: open now / opening later today / closed today. Time logic always uses `Asia/Kuala_Lumpur`.
- "Near me" button (browser geolocation, optional — map still works if denied).
- **Tap a pasar → map flies/zooms into it** and shows:
  - Pasar outline (if a boundary polygon exists). **No per-stall pins in Phase 1** — vendors are shown as a list only.
  - A bottom sheet (mobile) / side panel (desktop) with: name, days + hours, address, parking/notes, photos, vendor list grouped by category.
- Tap a vendor → vendor detail (name, category, what they sell, rough price range, photos, "usually here on" days).

### 4.2 Pasar & vendor pages

- Every pasar and vendor has its own shareable URL (SEO matters: people Google "pasar malam Seksyen 7 hari apa").
- Search by pasar name, area, or food ("apam balik", "burger bakar").

### 4.3 Kedai Rumah (home business section)

- Separate menu/tab, visually distinct from the pasar map.
- List + map view of approved home businesses, filter by category and area.
- Business page: name, description, catalog items (photo, name, price), contact buttons (WhatsApp deep link, Instagram), delivery/pickup notes, operating hours.
- **Privacy: never show a home address or exact location publicly.** Show district/area only; any map pin uses a fuzzed point (~500 m offset, computed server-side).

### 4.4 Accounts (optional)

- Supabase Auth: Google sign-in + email magic link. (Phone OTP later if needed.)
- Logged-in users can: register a home business, manage their catalog, claim a vendor stall, save favourites.
- New businesses go to `pending` → admin approves → public.

### 4.4b Vendors (both routes)

- Admin can add vendors directly.
- Logged-in users can **register a new stall** or **claim an existing one**. Both go to `pending` → admin approves.
- Only approved vendors show publicly.

### 4.5 Community reports

- **Login required to report.**
- "Report wrong info" on pasar/vendor/business pages (e.g. stall no longer there, pasar cancelled, wrong day).
- Goes to admin queue. No auto-edits in Phase 1.

### 4.6 Admin

- Simple protected `/admin` area: CRUD pasar + schedules + vendors, approve/reject businesses, review reports.

## 5. Tech stack (decided)

**Website first, built as a mobile-first PWA.** Reasons: no app store friction for visitors, pages are indexable by Google, installable to home screen. A native app (Expo/React Native on the same Supabase backend) is reserved for Phase 2 riders, who need background location and reliable push notifications.

| Layer       | Choice                                                | Notes                                                                                                                   |
| ----------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Framework   | **Next.js (App Router) + TypeScript**                 | SSR/SSG for SEO on pasar/vendor/business pages                                                                          |
| Styling     | Tailwind CSS + shadcn/ui                              | Mobile-first                                                                                                            |
| i18n        | **next-intl**                                         | BM default (no prefix), English under `/en`. All UI strings in `messages/ms.json` + `messages/en.json`, never hardcoded |
| Map         | **MapLibre GL JS** (via `react-map-gl/maplibre`)      | Free vector tiles (OpenFreeMap or MapTiler free tier); no Google Maps billing                                           |
| Backend     | **Supabase** (Postgres + PostGIS, Auth, Storage, RLS) | Separate Supabase project from Bolahh, same organization                                                                |
| Data access | `@supabase/ssr` for server + client                   | Generate DB types with Supabase CLI                                                                                     |
| Hosting     | Vercel                                                |                                                                                                                         |
| PWA         | `@serwist/next` (or equivalent)                       | Manifest + offline shell                                                                                                |

## 6. Data model (draft — refine in migrations)

All geo columns use PostGIS `geography(Point, 4326)` / `geography(Polygon, 4326)`.

- **profiles** — `id` (= auth.users.id), `display_name`, `avatar_url`, `role` (`user` | `admin`), timestamps
- **pasars** — `id`, `slug`, `name`, `description`, `location` (point), `boundary` (polygon, nullable), `address`, `district`, `state`, `parking_notes`, `photos[]`, `status` (`active` | `inactive`), timestamps
- **pasar_schedules** — `id`, `pasar_id`, `day_of_week` (0–6), `start_time`, `end_time` (a pasar can run on multiple days)
- **vendor_categories** — `id`, `slug`, `name_ms`, `name_en`, `icon`
- **vendors** — `id`, `pasar_id`, `name`, `category_id`, `description`, `price_range`, `photos[]`, `position` (point, nullable, unused in P1), `usual_days` (int[]), `owner_id` (nullable, for claimed stalls), `status` (`pending` | `active` | `inactive`), timestamps
- **vendor_claims** — `id`, `vendor_id`, `user_id`, `message`, `status` (`pending` | `approved` | `rejected`), timestamps
- **home_businesses** — `id`, `slug`, `owner_id`, `name`, `category_id`, `description`, `district`, `state`, `public_location` (fuzzed point), `whatsapp`, `instagram`, `delivery_notes`, `hours`, `logo_url`, `status` (`pending` | `approved` | `rejected`), timestamps
- **catalog_items** — `id`, `business_id`, `name`, `description`, `price_rm` (numeric), `photo_url`, `is_available`, `sort_order`
- **favourites** — `user_id`, `target_type` (`pasar` | `vendor` | `business`), `target_id`
- **reports** — `id`, `target_type`, `target_id`, `reason`, `details`, `reporter_id` (required), `status` (`open` | `resolved`), timestamps

Useful RPCs: `pasars_near(lat, lng, radius_m, day_of_week)`, `search_all(query)`.

## 7. Security rules (RLS)

- RLS **on for every table**.
- Anonymous + authenticated: `SELECT` only rows that are public (`active` pasars/vendors, `approved` businesses and their items).
- Owners: full control of their own `home_businesses` / `catalog_items` / claimed `vendors`; cannot change `status`.
- Admins (`profiles.role = 'admin'`): full access.
- Never expose exact home addresses; only `public_location` is readable.
- Storage buckets: `pasar-photos` (admin write), `business-photos` (owner write to their own folder), all public read.

## 8. Suggested routes

BM routes have no prefix; English mirrors them under `/en` (e.g. `/en/pasar/[slug]`).

```
/                       Map (pasar)
/pasar/[slug]           Pasar page
/pasar/[slug]/[vendor]  Vendor page
/kedai                  Home business list + map
/kedai/[slug]           Business page
/cari                   Search
/login
/akaun                  My account, favourites
/akaun/kedai            Manage my business + catalog
/admin/...              Admin area
```

## 9. Design direction

- Palette: **"Lampu Malam"** (night sky + warm stall lights).
- **Light + dark mode required.** Default follows system (`prefers-color-scheme`), with a manual toggle saved per user. Use `next-themes` + Tailwind `darkMode: 'class'`.
- Define colours as CSS variables (semantic tokens), never hardcode hex in components. All text pairs below pass WCAG AA.

| Token          | Light     | Dark      | Use                                                          |
| -------------- | --------- | --------- | ------------------------------------------------------------ |
| `--bg`         | `#FFF6E9` | `#12152B` | Page background                                              |
| `--card`       | `#FFFFFF` | `#1B1F3B` | Cards, bottom sheets                                         |
| `--border`     | `#EADFCC` | `#2E3355` | Hairlines                                                    |
| `--text`       | `#1B1F3B` | `#FFF6E9` | Primary text                                                 |
| `--text-muted` | `#5A5F7A` | `#B8B6C9` | Secondary text                                               |
| `--pasar`      | `#F5A623` | `#F5A623` | Pasar pins, active chips (text on it: `#1B1F3B` / `#12152B`) |
| `--pasar-text` | `#8A5A00` | `#F5A623` | Amber used as text                                           |
| `--cta`        | `#C8431C` | `#FF6B45` | The one primary button (text on it: `#FFFFFF` / `#12152B`)   |
| `--open`       | `#2E7D3A` | `#4CC262` | "Open now" status only                                       |
| `--kedai`      | `#0B7A6E` | `#2EC4B6` | Kedai Rumah section identity                                 |

- Map tiles must switch with the theme (light style vs dark style).
- Pasar section = amber identity; Kedai Rumah = teal identity. Users should always know which mode they're in.
- One CTA colour only. Status colours are for status only.
- **Phone is the main device; desktop is supported.** Design and test at 375px first, then scale up.
  - Breakpoint: `< 768px` = mobile layout, `≥ 1024px` = desktop layout (tablet can use either, keep it usable).
  - **Mobile:** full-screen map, bottom tab bar (Pasar | Kedai Rumah | Cari | Akaun), draggable bottom sheet for details, thumb-reachable controls, 44px min tap targets.
  - **Desktop:** top nav bar, map on the right with a ~400px left side panel for lists and details (no bottom sheets), hover states, keyboard-friendly search.
  - Same routes and data on both; only the layout changes. Fast on slow 4G.

## 10. Non-goals for Phase 1

Riders/delivery, online ordering, in-app payments, reviews/ratings, chat, native mobile app.

## 11. Conventions

- TypeScript strict. No `any`.
- All schema changes via `supabase/migrations/`. Regenerate types after each migration.
- Seed data in `supabase/seed.sql` (a few real Shah Alam pasars for development).
- Server components by default; client components only for the map and interactive UI.
- UI copy: short, casual, sentence case. Every string in both BM and English.
- **Build one part at a time from `BUILD_PLAN.md`.** Stop at the end of each part and summarise; don't start the next part until asked.

## 12. Decisions log

- Languages: BM (default) + English toggle
- Inside a pasar: vendor list only, no per-stall pins (Phase 1)
- Vendors: admin-added **and** user self-register/claim, both moderated
- Reports: login required
- Domain: tapaulahh.com
- Logo: Cho provides; use a text wordmark placeholder until then
