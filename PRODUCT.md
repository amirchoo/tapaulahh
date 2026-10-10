# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Visitors (primary):** locals, plus tourists and people new to an area. They want to know which pasar malam runs near them tonight, whether it's open right now, and which stalls are there and what they sell, before they go and while they're walking around it. No account needed.
- **Peniaga Kecil owners:** small home businesses that make and manage one shop page with a catalog. They need an account, and an admin approves the business before it goes public.
- **Pasar vendors:** register a new stall or claim an existing one (moderated).
- **Admin (founder):** adds and edits pasars, stalls and menus, approves businesses, hides reviews, handles reports.
- **Pasar organisers:** a confirmed user type, but what they can do in Phase 1 is still open (see VISION.md §12).

## Product Purpose

A map-first website for discovering pasar malam in Malaysia and the stalls at each one, plus a separate showcase for small home businesses. It answers "where can I tapau tonight, and what's there?" Launching in Shah Alam / Klang Valley first. Success means a visitor can go from opening the site to knowing where to go and what to eat, without an account.

## Positioning

Information at the level of the day and the stall. Google Maps, Instagram and Facebook groups don't reliably say which day a pasar runs, whether it's open right now (always in Asia/Kuala_Lumpur time), or which stalls are there with their menus, prices and photos. Tapaulahh does. Every pasar and stall has its own shareable URL that Google can index ("pasar malam Seksyen 7 hari apa").

## Operating Context

- Phone first (375px), desktop supported. Often used outdoors at night, one-handed, while walking around a pasar, in dim or bright light.
- Cheap Android phones on patchy 4G are common.
- Bilingual: Bahasa Melayu by default, English under `/en`. The English must be complete and natural, and food and place names should make sense to someone who doesn't know them.
- Sister product to Bolahh (futsal booking), from the same company.

## Capabilities and Constraints

- Phase 1: pasar map with day filter and open/later/closed status, pasar and stall pages with menus, Peniaga Kecil list and map, search, optional accounts, reviews, admin moderation. Phase 2 (riders, ordering) is out of scope, but the data model shouldn't block it.
- All public information can be read without an account. Logging in is only needed to create or manage content, review, or report.
- Privacy: a home business's exact location is never shown. Only the district/area and a fuzzed circle of about 500 m.
- Terms: "pasar" and "kedai" stay the same in both languages. The section is "Peniaga Kecil" (it used to be "Kedai Rumah").
- Two section identities: Pasar and Peniaga Kecil. Users should always know which one they're in.
- Still undecided: what organisers can do, and whether tourists need more than good English (for example, explaining dishes).

## Brand Commitments

- Name: Tapaulahh ("tapau" = takeaway in Malaysian slang). Domain tapaulahh.com.
- Voice: casual, local, Manglish/BM-friendly. Short sentence-case copy in both languages.
- Logo: Cho is providing it. The text wordmark "tapaulahh" stands in until then.

## Evidence on Hand

- Real pasar, stall and menu data entered through admin (no sample data in the database).
- The owner's own real photos of stalls and food.
- Nothing else: no user counts, testimonials, press or traction figures. Never make up stats or reviews.

## Product Principles

1. Tonight first: what's open now and today comes before everything else.
2. Detail down to the stall: the value is knowing which stalls are there and what they sell, not just a pin on a map.
3. Open to anyone: browsing never needs an account.
4. Both languages are first class: BM and English are equally complete and natural.
5. Protect home sellers: their privacy comes before precision on the map.

## Accessibility & Inclusion

- WCAG AA contrast in light and dark mode, and tap targets of at least 44px.
- Must stay readable and usable outdoors at night, one-handed, in dim or bright light.
- Older users (parents, makcik/pakcik sellers) use it too: readable text sizes, plain words, simple flows.
- Must stay light and fast on cheap Android phones and slow 4G.
