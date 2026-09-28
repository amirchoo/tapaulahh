# Bolahh → Tapaulahh cheat sheet

If you know Bolahh (Vite + React Router + i18next + inline styles), this maps each habit to where it lives in Tapaulahh (Next.js + TypeScript + next-intl + Tailwind).

Most of it is the same React you already write. The one new idea is **server components** (section 4).

---

## 1. Commands

| Bolahh                              | Tapaulahh                                |
| ----------------------------------- | ---------------------------------------- |
| `cd client && npm run dev`          | `npm run dev` (from the project root)    |
| Opens on <http://localhost:5173>    | Opens on <http://localhost:3000>         |
| Press `q` to quit                   | Press `Control + C` to quit              |
| `npm run build` / `npm run preview` | `npm run build` / `npm start`            |
| `npm run lint`                      | `npm run lint`, plus `npm run typecheck` |

---

## 2. Where things live

| Bolahh (`client/src/…`)              | Tapaulahh (`src/…`)                                                |
| ------------------------------------ | ------------------------------------------------------------------ |
| `App.jsx` with `<Route path=…>` list | **No route list.** Folders in `app/[locale]/` are the routes       |
| `pages/GameDetailPage.jsx`           | `app/[locale]/pasar/[slug]/page.tsx`                               |
| `components/Navbar.jsx`              | `components/shell/site-header.tsx`, `nav-tabs.tsx`                 |
| `lib/*.js` helpers                   | `lib/*.ts` helpers (e.g. `lib/pasar/schedule.ts`)                  |
| `lib/supabaseClient.js`              | `lib/supabase/server.ts` + `client.ts` (from Part 2)               |
| `context/AuthContext.jsx`            | Checked on the server per page (from Part 5)                       |
| `styles/globals.css` (CSS variables) | `app/globals.css` (CSS variables + Tailwind)                       |
| `locales/en.json`, `locales/ms.json` | `messages/en.json`, `messages/ms.json` (project root)              |
| `i18n.js`                            | `i18n/routing.ts`, `i18n/request.ts`                               |
| `supabase/migrations/`, `seed.sql`   | Same, `supabase/migrations/` and `supabase/seed.sql` (from Part 2) |
| `client/.env` with `VITE_…`          | `.env.local` with `NEXT_PUBLIC_…` (root)                           |
| `vercel.json` rewrites for the SPA   | Not needed, Next.js handles it on Vercel                           |

`[locale]` is in every path because BM lives at `/` and English at `/en`. You never type it in links; see section 3.

---

## 3. Routing

### Adding a page

**Bolahh:** create the file, import it in `App.jsx`, add a `<Route>`.

```jsx
// App.jsx
import GameDetailPage from "./pages/GameDetailPage";
<Route path="/game/:id" element={<GameDetailPage />} />;
```

**Tapaulahh:** create a folder with a `page.tsx`, then add its path to `pathnames` in `src/i18n/routing.ts` (that's where the English URL is set).

```
src/app/[locale]/pasar/[slug]/page.tsx   →   /pasar/seksyen-7   and   /en/pasar/seksyen-7
src/app/[locale]/cari/page.tsx           →   /cari              and   /en/search
```

```ts
// src/i18n/routing.ts
pathnames: {
  "/pasar/[slug]": "/pasar/[slug]",          // same in both languages
  "/cari": { ms: "/cari", en: "/search" },    // translated for English
}
```

Folders and code always use the **BM** path. English URLs come from this list automatically.

`[slug]` in the folder name is the same as `:slug` in a React Router path.

### Reading URL params

```jsx
// Bolahh
const { id } = useParams();
const [searchParams] = useSearchParams();
const isPreview = searchParams.get("preview") === "1";
```

```tsx
// Tapaulahh: params arrive as props, and you await them
export default async function PasarPage({
  params,
  searchParams,
}: PageProps<"/[locale]/pasar/[slug]">) {
  await initLocale(params); // always first: sets BM/EN for this page
  const { slug } = await params;
  const { preview } = await searchParams;
}
```

`PageProps<"…">` is generated from the folder path, so `slug` is typed automatically.

### Links and navigation

| Bolahh (`react-router-dom`)          | Tapaulahh (`@/i18n/navigation`)                                 |
| ------------------------------------ | --------------------------------------------------------------- |
| `<Link to="/cari">`                  | `<Link href="/cari">`                                           |
| ``<Link to={`/game/${id}`}>``        | `<Link href={{ pathname: "/pasar/[slug]", params: { slug } }}>` |
| `const navigate = useNavigate()`     | `const router = useRouter()`                                    |
| `navigate('/home')`                  | `router.push("/")`                                              |
| `<Navigate to="/login" />`           | `redirect({ href: "/login", locale })` (server)                 |
| `NotFoundPage` route with `path="*"` | call `notFound()`; the page is `app/[locale]/not-found.tsx`     |
| `useLocation().pathname`             | `usePathname()`                                                 |

**Import `Link`, `useRouter`, `usePathname` and `redirect` from `@/i18n/navigation`, not from `next/link` or `next/navigation`.** Ours automatically keep the user in BM or English (`/pasar` vs `/en/pasar`).

For pages with a `[slug]`, pass the route plus params instead of building the string yourself. That way English gets the right URL, and TypeScript checks that the route exists and every param is filled in. `usePathname()` also returns the route (`"/pasar/[slug]"`), not the real path.

---

## 4. Server components (the one genuinely new idea)

In Bolahh, every component runs in the browser. You fetch in `useEffect`, keep a `loading` state, then render.

In Tapaulahh, **components run on the server by default.** They can be `async` and `await` data directly. The browser receives finished HTML, which is why Google and WhatsApp previews work.

```jsx
// Bolahh: fetch in the browser
function GameDetailPage() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setGame(data);
        setLoading(false);
      });
  }, [id]);
  if (loading) return null;
  return <h1>{game.name}</h1>;
}
```

```tsx
// Tapaulahh: fetch on the server, no loading state needed
export default async function PasarPage({
  params,
}: PageProps<"/[locale]/pasar/[slug]">) {
  await initLocale(params);
  const { slug } = await params;
  const pasar = await getPasar(slug);
  if (!pasar) notFound();
  return <h1>{pasar.name}</h1>;
}
```

### When do I need `"use client"`?

Put `"use client";` at the very top of a file when it uses anything that needs the browser:

- `useState`, `useEffect`, `useRef`, `useMemo` and other hooks
- `onClick`, `onChange` and other event handlers
- `window`, `document`, `localStorage`, `navigator.geolocation`
- the map (MapLibre)

Everything else stays a server component. The usual pattern is a server `page.tsx` that loads data and passes it into a small client component for the interactive part:

```tsx
// app/[locale]/pasar/page.tsx: server, loads data
const pasars = await getPasars();
return <PasarExplorer pasars={pasars} />;

// components/pasar/pasar-explorer.tsx: "use client", has the useState and the map
```

If you forget `"use client"`, Next.js shows a clear error like "useState only works in Client Components". Add the line and it's fixed.

---

## 5. Translations

| Bolahh (i18next)                               | Tapaulahh (next-intl)                                               |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `const { t } = useTranslation();`              | `const t = useTranslations("Login");` (client, or non-async server) |
| n/a                                            | `const t = await getTranslations("Login");` (async server)          |
| `t('login.errors.fillAll')`                    | `t("errors.fillAll")`; the namespace is picked above                |
| `t('hello', { name })` with `{{name}}` in JSON | `t("hello", { name })` with `{name}` in JSON (single braces)        |
| Language saved in `localStorage`               | Language is in the URL (`/en/…`) + the `tapau_locale` cookie        |
| Default language: English                      | Default language: **BM**                                            |
| `i18n.changeLanguage('ms')`                    | The EN/BM button in the header                                      |

JSON files look the same, grouped by page or feature:

```json
// messages/ms.json
{
  "Login": {
    "title": "Log masuk",
    "errors": { "fillAll": "Isi semua ruangan." }
  }
}
```

**Add every new key to both `ms.json` and `en.json`.** TypeScript checks every `t("…")` key against `ms.json`, so typos get caught. It doesn't check `en.json`, so double-check the English side yourself.

---

## 6. Styling: inline styles → Tailwind

Bolahh mostly uses inline styles with CSS variables. Tapaulahh uses Tailwind classes, which are short names for the same CSS.

```jsx
// Bolahh
<div
  style={{
    padding: 16,
    borderRadius: 12,
    background: "var(--card)",
    border: "1px solid var(--border)",
  }}
>
  <p style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>Hello</p>
</div>
```

```tsx
// Tapaulahh
<div className="rounded-xl border bg-card p-4">
  <p className="text-sm font-semibold text-muted-foreground">Hello</p>
</div>
```

### Most-used translations

| Inline style                                    | Tailwind                           |
| ----------------------------------------------- | ---------------------------------- |
| `padding: 16` / `paddingTop: 8`                 | `p-4` / `pt-2` (1 unit = 4px)      |
| `margin: '0 auto'`                              | `mx-auto`                          |
| `display: 'flex', gap: 8, alignItems: 'center'` | `flex items-center gap-2`          |
| `justifyContent: 'space-between'`               | `justify-between`                  |
| `flexDirection: 'column'`                       | `flex-col`                         |
| `display: 'grid', gridTemplateColumns: …`       | `grid grid-cols-2`                 |
| `fontSize: 14` / `20` / `30`                    | `text-sm` / `text-xl` / `text-3xl` |
| `fontWeight: 600` / `800`                       | `font-semibold` / `font-extrabold` |
| `borderRadius: 12` / `9999`                     | `rounded-xl` / `rounded-full`      |
| `width: '100%'` / `height: 44`                  | `w-full` / `h-11`                  |
| `maxWidth: 672`                                 | `max-w-2xl`                        |
| `position: 'absolute', inset: 0`                | `absolute inset-0`                 |
| `overflowY: 'auto'`                             | `overflow-y-auto`                  |
| `cursor: 'pointer'`                             | automatic on buttons               |
| `display: 'none'` on mobile only                | `hidden lg:block`                  |

**Responsive** is a prefix: `lg:` means "1024px and wider". `p-4 lg:p-8` is 16px on phones and 32px on desktop, with no media queries to write.

**Hover and focus** are prefixes too: `hover:bg-muted`, `focus-visible:ring-3`.

**Conditional classes** use `cn()` from `@/lib/utils`:

```tsx
<li className={cn("rounded-xl border", selected && "border-pasar")}>
```

### Colours

Like Bolahh's `var(--accent)`, colours are CSS variables, defined only in `src/app/globals.css`. Use them through these classes, and never write hex codes in components:

| Use                     | Classes                                         |
| ----------------------- | ----------------------------------------------- |
| Page background / cards | `bg-background`, `bg-card`                      |
| Text / secondary text   | `text-foreground`, `text-muted-foreground`      |
| Lines                   | `border` (uses the border colour automatically) |
| Pasar amber             | `bg-pasar text-on-pasar`, `text-pasar-text`     |
| Kedai Rumah teal        | `bg-kedai text-on-kedai`, `text-kedai`          |
| The one main button     | `bg-cta text-on-cta`                            |
| "Open now" only         | `text-open`, `bg-open`                          |

Dark mode is handled by the variables; you don't write anything extra.

The Tailwind VS Code extension ("Tailwind CSS IntelliSense") autocompletes classes and shows the CSS behind each one on hover. It's worth installing.

---

## 7. TypeScript in 2 minutes

It's JavaScript plus labels that describe the shape of your data. The editor then catches mistakes as you type.

```tsx
// Describe a shape once
type Pasar = { id: string; name: string; location: { lat: number; lng: number } };

// Label props
function PasarCard({ pasar, selected }: { pasar: Pasar; selected: boolean }) { … }

// Now this is a red squiggle instead of a runtime bug:
pasar.nmae;   // Property 'nmae' does not exist on type 'Pasar'
```

- Files are `.ts` (logic) or `.tsx` (has JSX).
- **No `any`.** It switches the checking off. If you're stuck on a type, ask.
- `npm run typecheck` checks the whole project.
- From Part 2, Supabase generates types for every table, so `supabase.from("pasars").select("name")` knows `name` is a string.

---

## 8. Supabase

The query syntax is **exactly the same** as Bolahh:

```ts
const { data, error } = await supabase
  .from("pasars")
  .select("*, pasar_schedules(*)")
  .eq("slug", slug)
  .single();
```

What's different:

| Bolahh                                       | Tapaulahh                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| One client, `lib/supabaseClient.js`          | Three clients in `src/lib/supabase/` (below)                                      |
| `import.meta.env.VITE_SUPABASE_URL`          | `process.env.NEXT_PUBLIC_SUPABASE_URL` (in `.env.local`)                          |
| `VITE_SUPABASE_ANON_KEY`                     | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase's newer name for the same thing) |
| Session in `localStorage` / `sessionStorage` | Session in cookies, so the server knows who's logged in (Part 5)                  |
| `PrivateRoute` / `AdminRoute` wrappers       | Check the user at the top of the page, then `redirect()` (Part 5)                 |
| No generated types                           | `npm run db:types` writes types for every table; typos in column names are errors |
| `supabase` CLI, `migrations/`, `db push`     | Same, plus `npm run db:push` and `npm run test:db`                                |
| Local ports 54321–54329                      | 55321–55329, so both projects can run locally at once                             |

**Which client do I use?**

| File                     | Use it for                                              | Where               |
| ------------------------ | ------------------------------------------------------- | ------------------- |
| `lib/supabase/public.ts` | Public data anyone can see (pasars, approved shops)     | Server components   |
| `lib/supabase/server.ts` | Anything about the logged-in user (favourites, my shop) | Server components   |
| `lib/supabase/client.ts` | Clicks in the browser (e.g. the heart button)           | `"use client"` code |

The public client doesn't read cookies, so pages stay fast and cached. Its results are cached for 5 minutes under the tag `public-data`.

**Changing the database:** never edit tables in the Supabase dashboard. Add a new file in `supabase/migrations/` (copy the naming, e.g. `20261001120000_add_pasar_notes.sql`), then:

```bash
npm run db:push    # apply it to the cloud project
npm run db:types   # refresh the TypeScript types
npm run test:db    # re-run the security checks
```

## 9. Gotchas

1. **`params` must be awaited:** `const { slug } = await params;`. It's a Promise in Next.js 16.
2. **Start pages with `await initLocale(params)`,** or the page can render in the wrong language.
3. **Import `Link` from `@/i18n/navigation`,** not `next/link`.
4. **New page? Add it to `pathnames`** in `src/i18n/routing.ts`, or links to it won't type-check and English won't get a URL.
5. **Links to `[slug]` pages use an object:** `href={{ pathname: "/pasar/[slug]", params: { slug } }}`, not a template string.
6. **Hooks need `"use client"`** at the top of the file.
7. **No hardcoded text:** use `t("…")`, with the key in both JSON files.
8. **No hex colours in components:** use the colour classes in section 6.
9. **Middleware is called `proxy.ts`** in Next.js 16 (`src/proxy.ts`).
10. **Map changes may need a hard refresh** (`Cmd + Shift + R`), because the map only reads its starting view on first load.
