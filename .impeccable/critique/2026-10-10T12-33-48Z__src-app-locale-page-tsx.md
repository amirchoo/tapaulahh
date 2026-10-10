---
target: home
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/user/Documents/Tapaulahh/src/app/[locale]/page.tsx"
target_fingerprint: "sha256:959b804ceffd491311b509094262580c95e893973e363a192031daf4219eeca1"
target_path: /Users/user/Documents/Tapaulahh/src/app/[locale]/page.tsx
timestamp: 2026-10-10T12-33-48Z
slug: src-app-locale-page-tsx
---
# Critique: home (src/app/[locale]/page.tsx)
Method: dual-agent (A: ab97e2da8fcaa734d · B: a5da5feb8e9c4957d). A did screenshots at 375/1440 (headless Chrome, real data, 21:24 MYT); B's browser overlay was skipped (no Playwright).

## Heuristics: 22/40 (Acceptable)
1 Status 3 (live status good; client-only, skeletons on slow 4G; closed pasars under "Buka malam ni")
2 Real world 3 (great voice; full postal addresses; food names unexplained in /en; "Anda" register clash)
3 Control 2 (horizontal overflow; no day switch / near me)
4 Consistency 2 (three routes to /pasar; title vs content)
5 Error prevention 2 (layout breaks on every-day pasar; empty search submits)
6 Recognition 3 (chips + area list; ambiguous "EN" toggle)
7 Flexibility 2 (no near me, no tomorrow)
8 Minimalism 2 (banner, duplicate section cards, expanded area list)
9 Error recovery 1 (empty tonight = dead end; overflow hides controls)
10 Help 2 (nothing explains pasar malam / tapau to tourists)

## Specificity
Copy and dark palette are authored; structure is a stock landing stack (hero, search, banner, card rail, 2 icon-in-circle feature cards, chips, link directory, CTA). No photos, no stalls or dishes shown despite positioning. Detector: 1 hit, side-tab border-l-4 on growing note (page.tsx:93), confirmed real.

## Priority issues
- [P0] Horizontal overflow at 375px: shrink-0 day label (page.tsx:206) + every-day pasar spelled out; clips Cari, Tengok peta, header toggles, Akaun tab. Fix: drop shrink-0/min-w-0, "Setiap hari", short days, stack on mobile. harden/adapt
- [P1] Tonight isn't first; cards carry postal address not photo/stalls; title includes closed pasars. layout/distill
- [P1] Empty and slow-network tonight states are dead ends; server-render today's list, "Esok ada X pasar". harden/onboard
- [P2] Template middle: icon-circle section cards duplicate nav; sparkles side-tab note. distill/bolder
- [P2] Readability for older users and tourists: 11px tab labels, 14px muted status/address, no English gloss on food chips. typeset/clarify

## Personas
Jordan (tourist): no explanation of pasar malam/fixed days, untranslated chips, "check back soon" invites leaving.
Casey (one-handed at night): overflow, skeletons, tonight below the fold, no distance.
Mak Som (older local): 11px labels, unlabeled theme icon, ambiguous EN, seller CTA is the only orange button.

## Minor
/en intro grammar ("on today"); 3-col desktop grid with 2 results leaves a hole; "· 1 pasar" repeated per district; "seluruh Malaysia" vs Klang Valley launch; "gerai penjaja" adds a third term.
