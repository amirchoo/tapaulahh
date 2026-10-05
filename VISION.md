# Tapaulahh: Project Vision (Phase 1)

> Read this first. It describes what Tapaulahh is, what Phase 1 includes, and the technical decisions already made. Anything under "Open questions" is not decided yet, so ask before assuming.

## 1. What Tapaulahh is

A map-first website for discovering **pasar malam** (night markets) in Malaysia and the **vendors** at each one, plus a separate section where **home-based small businesses** showcase their catalog.

- Sister product to **Bolahh** (futsal booking platform), same company, same founder/developer.
- Name: "tapau" = takeaway in Malaysian slang. Brand voice is casual, local, Manglish/BM-friendly.
- Launch area: **Shah Alam / Klang Valley** first, then expand.
- Domain: **tapaulahh.com**
- Languages: **Bahasa Melayu (default) + English**, user can switch.
- Audience: **locals first, plus tourists and visitors unfamiliar with an area.** English must be complete and natural, not an afterthought, and food and place names should make sense to someone who doesn't know them.

## 2. Phases

| Phase       | Scope                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------- |
| **1 (now)** | Pasar malam map + vendor info, home business catalog, optional accounts, admin moderation |
| 2 (later)   | Riders / delivery ("tapau for me"), ordering, likely a native app for riders              |

**Do not build Phase 2 features.** But keep the data model friendly to it (e.g. vendors and businesses can later receive orders; users have accounts).

## 3. Users

| User                                              | Needs                                                                                    | Login required?  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------- |
| Visitor (locals, tourists, people new to an area) | Find pasar malam near them, see which day it runs, browse vendors before going           | **No**           |
| Home business owner                               | Create and manage a shop page + catalog                                                  | Yes              |
| Pasar vendor                                      | Register a new stall or claim an existing one, edit its info                             | Yes              |
| Admin (founder)                                   | Add/edit pasar data, approve businesses, handle reports                                  | Yes (admin role) |
| Pasar organiser                                   | Share information about their pasar with visitors (see Open questions for Phase 1 scope) | Yes              |

**Core rule: all public info is readable without an account.** Login is only for creating/managing content (and later, Phase 2 riders/ordering).

## 4. Core features (Phase 1)

### 4.0 Home (`/`)

- Answers "where can I tapau tonight?" on its own: greeting + search, "Buka malam ni" (pasars running today with live status), entry cards for Pasar malam (amber) and Peniaga Kecil (teal), popular food search chips, pasar-by-area list (server-rendered, for SEO), and one "Daftar sekarang" CTA for stalls and home businesses.

### 4.1 Pasar map (`/pasar`)

- Full-screen map, pasar markers clustered when zoomed out.
- Default filter: **"Hari ini"** (pasar operating today). Chips for each day of the week.
- Marker status: open now / opening later today / closed today. Time logic always uses `Asia/Kuala_Lumpur`.
- "Near me" button (browser geolocation, optional; the map still works if it's denied).
- **Tap a pasar → map flies/zooms into it** and shows:
  - Pasar outline (if a boundary polygon exists). **No per-stall pins in Phase 1.** Vendors are shown as a list only.
  - A bottom sheet (mobile) / side panel (desktop) with: name, days + hours, address, parking/notes, photos, vendor list grouped by category.
- Tap a vendor → vendor detail (name, category, what they sell, rough price range, photos, menu with prices and photos, "usually here on" days).

### 4.2 Pasar & vendor pages

- Every pasar and vendor has its own shareable URL (SEO matters: people Google "pasar malam Seksyen 7 hari apa").
- Search by pasar name, area, or food ("apam balik", "burger bakar").

### 4.3 Peniaga Kecil (small home businesses; was "Kedai Rumah")

- Separate menu/tab, visually distinct from the pasar map.
- List + map view of approved home businesses, filter by category and area.
- Business page: name, description, catalog items (photo, name, price), contact buttons (WhatsApp deep link, Instagram), delivery/pickup notes, operating hours.
- **Privacy: never show a home address or exact location publicly.** Show district/area only; any map pin uses a fuzzed point (~500 m offset, computed server-side).

### 4.4 Accounts (optional)

- Supabase Auth: email + password (email confirmed with a code or link), an email-code log-in fallback, forgot password, and Google sign-in. (Phone OTP later if needed.)
- Logged-in users can: register a home business, manage their catalog, claim a vendor stall, save favourites.
- New businesses go to `pending` → admin approves → public.

### 4.4b Vendors (both routes)

- Admin can add vendors directly.
- Logged-in users can **register a new stall** or **claim an existing one**. Both go to `pending` → admin approves.
- Only approved vendors show publicly.

### 4.4c Community reviews

- **Login required.** 1 to 5 stars + optional comment on each pasar and stall, one per person (editable). Shown at once; admins can hide any review. Average rating shown at the top of the pasar/stall page.

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

## 6. Data model

Built in `supabase/migrations/` (the source of truth; this is a summary). All geo columns use PostGIS `geography(Point, 4326)` / `geography(Polygon, 4326)`, and point tables also expose generated `lat`/`lng` number columns for the API.

- **profiles**: `id` (= auth.users.id), `display_name`, `avatar_url`, `role` (`user` | `admin`), timestamps. Created automatically on sign-up.
- **pasars**: `id`, `slug`, `name`, `description`, `location` (point) + `lat`/`lng`, `boundary` (polygon, nullable), `address`, `district`, `state`, `parking_notes`, `photos[]`, `status` (`active` | `inactive`), timestamps
- **pasar_schedules**: `id`, `pasar_id`, `day_of_week` (0 = Sunday … 6 = Saturday), `start_time`, `end_time` (end ≤ start means it runs past midnight; a pasar can run on multiple days)
- **vendor_categories**: `id`, `slug`, `name_ms`, `name_en`, `icon` (Lucide name), `sort_order`. 12 starting categories.
- **vendors**: `id`, `pasar_id`, `slug` (unique per pasar, for `/pasar/[slug]/[vendor]`), `name`, `category_id`, `description`, `price_range`, `photos[]`, `position` (point, nullable, unused in P1), `usual_days` (smallint[]), `owner_id` (nullable, for claimed stalls), `status` (`pending` | `active` | `inactive`), timestamps
- **vendor_items**: `id`, `vendor_id`, `name`, `description`, `price_rm` (numeric, optional), `photo_url`, `is_available`, `sort_order`, timestamps. A stall's menu; editable by admins and the stall's owner. `search_all` matches stalls by their available items.
- **vendor_claims**: `id`, `vendor_id`, `user_id`, `message`, `status` (`pending` | `approved` | `rejected`), timestamps. Approving a claim sets the stall's `owner_id`.
- **business_categories**: same shape as vendor_categories, separate list for Peniaga Kecil (cakes, catering, frozen food, crafts…). 10 starting categories.
- **home_businesses**: `id`, `slug`, `owner_id`, `name`, `category_id`, `description`, `district`, `state`, `public_location` (fuzzed point, set by trigger) + `public_lat`/`public_lng`, `whatsapp` (digits with country code), `instagram` (handle), `delivery_notes`, `hours`, `logo_url`, `status` (`pending` | `approved` | `rejected`), timestamps
- **home_business_locations**: `business_id`, `address`, `location` (exact point). **Private: owner and admins only.** Saving it recomputes `public_location` 300 to 600 m away, in a direction fixed per business.
- **catalog_items**: `id`, `business_id`, `name`, `description`, `price_rm` (numeric), `photo_url`, `is_available`, `sort_order`, timestamps
- **favourites**: `user_id`, `target_type` (`pasar` | `vendor` | `business`), `target_id`
- **reviews**: `id`, `target_type` (`pasar` | `vendor`; `business` allowed for later), `target_id`, `user_id`, `rating` (1 to 5), `body` (optional, ≤ 1000), `status` (`visible` | `hidden`), timestamps. One per user per target. Posted instantly; authors edit/delete their own; admins hide. Public list via `reviews_for(type, id)` (returns author name + avatar only, profiles stay private). Removed when the pasar/stall is deleted.
- **reports**: `id`, `target_type`, `target_id`, `reason`, `details`, `reporter_id` (required), `status` (`open` | `resolved`), `resolved_by`, `resolved_at`, timestamps

RPCs: `pasars_near(lat, lng, radius_m, day_of_week)` and `search_all(query)` (substring + fuzzy match across pasars, stalls, shops and catalog items).

## 7. Security rules (RLS)

- RLS **on for every table**.
- Anonymous + authenticated: `SELECT` only rows that are public (`active` pasars/vendors, `approved` businesses and their items).
- Owners: full control of their own `home_businesses` / `catalog_items` / claimed `vendors`; cannot change `status`.
- Admins (`profiles.role = 'admin'`): full access.
- Never expose exact home addresses; only `public_location` is readable.
- Storage buckets: `pasar-photos` (admin write), `business-photos` (owner write to their own folder), all public read.

## 8. Routes

BM routes have no prefix. English lives under `/en` with translated paths, except the brand words "pasar" and "kedai", which stay the same in both languages. The mapping is in `src/i18n/routing.ts` (`pathnames`).

```
BM                      English                    Page
/                       /en                        Home
/pasar                  /en/pasar                  Map (pasar)
/pasar/[slug]           /en/pasar/[slug]           Pasar page
/pasar/[slug]/[vendor]  /en/pasar/[slug]/[vendor]  Vendor page
/kedai                  /en/kedai                  Home business list + map
/kedai/[slug]           /en/kedai/[slug]           Business page
/cari                   /en/search                 Search
/login                  /en/login                  Log in (password, email code or Google)
/daftar                 /en/sign-up                Sign up (name, email, password)
/lupa-kata-laluan       /en/forgot-password        Forgot password
/akaun                  /en/account                My account, favourites
/akaun/selamat-datang   /en/account/welcome        First-time name step
/akaun/kata-laluan      /en/account/password       Set / change password
/akaun/kedai            /en/account/shop           Manage my business + catalog
/admin                  /en/admin                  Admin: pasar list
/admin/pasar/baru       /en/admin/pasar/new        Add pasar
/admin/pasar/[id]       /en/admin/pasar/[id]       Edit pasar + its stalls
/admin/pasar/[id]/gerai/baru         …/stalls/new         Add stall
/admin/pasar/[id]/gerai/[vendorId]   …/stalls/[vendorId]  Edit stall
/auth/callback          (same)                     Email link + Google land here
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
| `--kedai`      | `#0B7A6E` | `#2EC4B6` | Peniaga Kecil section identity                               |

- Map tiles must switch with the theme (light style vs dark style).
- Pasar section = amber identity; Peniaga Kecil = teal identity. Users should always know which mode they're in.
- One CTA colour only. Status colours are for status only.
- **Phone is the main device; desktop is supported.** Design and test at 375px first, then scale up.
  - Breakpoint: `< 768px` = mobile layout, `≥ 1024px` = desktop layout (tablet can use either, keep it usable).
  - **Mobile:** full-screen map, bottom tab bar (Utama | Pasar | Peniaga Kecil | Akaun; search lives at the top of Utama), draggable bottom sheet for details, thumb-reachable controls, 44px min tap targets.
  - **Desktop:** top nav bar, map on the right with a ~400px left side panel for lists and details (no bottom sheets), hover states, keyboard-friendly search.
  - Same routes and data on both; only the layout changes. Fast on slow 4G.

## 10. Non-goals for Phase 1

Riders/delivery, online ordering, in-app payments, chat, native mobile app. (Reviews and ratings were moved into Phase 1 on 2026-10-04.)

## 11. Conventions

- TypeScript strict. No `any`.
- All schema changes via `supabase/migrations/`. Regenerate types after each migration.
- Seed data in `supabase/seed.sql` (a few real Shah Alam pasars for development).
- Server components by default; client components only for the map and interactive UI.
- UI copy: short, casual, sentence case. Every string in both BM and English.
- **Build one part at a time from `BUILD_PLAN.md`.** Stop at the end of each part and summarise; don't start the next part until asked.

## 12. Open questions

- **Pasar organisers:** what can they do in Phase 1? For example: claim a pasar (like vendors claim stalls), edit its days and hours, post "cancelled tonight" notices, manage the vendor list. Needs a decision before Parts 7 to 8, and the data model would need an organiser link on `pasars` (e.g. `organiser_id` or a `pasar_claims` table).
- **Tourists:** does serving tourists need anything beyond good English (e.g. short explanations of dishes, "what is a pasar malam" help)? Not planned yet.

## 13. Decisions log

- Languages: BM (default) + English toggle
- Inside a pasar: vendor list only, no per-stall pins (Phase 1)
- Vendors: admin-added **and** user self-register/claim, both moderated
- Reports: login required
- Domain: tapaulahh.com
- Logo: Cho provides; use a text wordmark placeholder until then
- Home page at `/` added; the pasar map moved to `/pasar`. Tabs: Utama | Pasar | Peniaga Kecil | Akaun (Cari dropped from the tab bar, search is on the home page; `/cari` stays for results) (2026-09-28)
- Audience widened: tourists and visitors unfamiliar with an area, plus pasar organisers as a user type (scope open) (2026-09-28)
- English URLs translated (`/en/search`, `/en/account`, `/en/account/shop`); "pasar" and "kedai" kept as brand words in both languages (2026-09-28)
- Supabase: separate `Tapaulahh` project in the Team Bolahh org (shared Pro plan). Develop against the cloud project for now; add local Docker before launch (2026-09-28)
- No sample pasar/vendor data in the database; real data goes in through the admin area. Categories are seeded as reference data (2026-09-28)
- Accounts: email code + link instead of link-only (email apps open links in their own browser on phones), plus a separate `/daftar` sign-up page that asks for a name. Google button shows once the provider is on (2026-10-02)
- Admin pasar + stall management built ahead of Part 8 (moderation queues still to come). Pasar location is entered by pasting a Google Maps link or coordinates, not a map picker. Photos uploaded now, compressed in the browser (2026-10-02)
- Accounts get passwords: sign up with name + email + password, confirmed by an emailed code; email-code log-in kept as a fallback; forgot-password flow. Supabase Site URL / redirect URLs fixed (email links went to localhost) (2026-10-03)
- Stalls get a menu (`vendor_items`): food with photo, description, optional price, sold-out flag, admin-ordered (2026-10-04)
- Community reviews (stars + optional comment) on pasars and stalls, moved in from the Phase 1 non-goals. Instant, admin can hide (2026-10-04)
- Section renamed from "Kedai Rumah" to "Peniaga Kecil" (same name in BM and English; URLs stay `/kedai`, tables stay `home_businesses`). `/kedai` map built: approved businesses as ~500 m teal circles around their fuzzed area (no exact pins, max zoom 14.5), category chips, "near me" (2026-10-04)
- Peniaga Kecil registration built: one business per account; pending until an admin approves at `/admin/peniaga`; rejection can include a note and the owner can resubmit; edits after approval go live without re-review; location optional (needed to appear on the map) (2026-10-05)
