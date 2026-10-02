# Sign-in setup (Supabase dashboard)

The code for accounts is in the repo, but some settings only live in the Supabase dashboard. Do these once for the Tapaulahh project (`duteuggmjqbselwotfqf`).

## How sign-in works

1. `/login` (or `/daftar` to sign up, which also asks for a name). The person types their email and gets an email with an **8-digit code** and a **link**.
2. They type the code, or tap the link. An email with no account yet gets one; the `profiles` row is created by the `handle_new_user` trigger.
3. New accounts with no name go to `/akaun/selamat-datang` (welcome step), then on to where they were heading (`?next=`).
4. Google (once switched on) goes Google → `/auth/callback` → the same place.

Why a code as well as a link: on phones, email apps often open links in their own browser, so the person would end up signed in there and not in their real browser. Typing the code always signs in the browser they started in. The link uses `token_hash`, so it also works in any browser.

| File                                 | What it does                                                      |
| ------------------------------------ | ----------------------------------------------------------------- |
| `src/lib/auth/actions.ts`            | Server actions: send code, check code, Google, save name, log out |
| `src/lib/auth/session.ts`            | `getCurrentUser()`, `getProfile()`, `requireUser()`               |
| `src/app/auth/callback/route.ts`     | Where email links and Google land                                 |
| `src/components/auth/login-form.tsx` | The two-step form (email → code)                                  |
| `src/proxy.ts`                       | Refreshes the session cookie for signed-in visitors               |
| `supabase/templates/sign-in.html`    | The email (code + link), BM and English                           |

## 1. URL configuration

Dashboard → Authentication → URL Configuration.

- **Site URL:** `https://tapaulahh.vercel.app` (change to `https://tapaulahh.com` at launch)
- **Redirect URLs:** add all of these
  - `http://localhost:3000/**`
  - `https://tapaulahh.vercel.app/**`
  - `https://tapaulahh-*.vercel.app/**` (Vercel previews of `dev`)

If a URL is missing, Supabase sends people to the Site URL instead and the email link breaks.

## 2. Email templates

Dashboard → Authentication → Emails → Templates. Do this for both **Confirm signup** and **Magic link**:

- **Subject:** `Kod Tapaulahh kau: {{ .Token }}`
- **Body:** paste everything in `supabase/templates/sign-in.html`

Until this is done, the default emails contain only a link (no code). The link still works, but only in the same browser.

## 3. Email sending (before real users)

Supabase's built-in email sender is for testing only: it sends very few emails per hour and only to members of the Supabase organisation. Before inviting real users, set up custom SMTP (Authentication → Emails → SMTP settings). [Resend](https://resend.com) has a free tier and works well; send from something like `hai@tapaulahh.com`.

## 4. Google sign-in (optional, any time)

The "Continue with Google" button appears on its own once Google is switched on (the login page checks Supabase's settings, cached for an hour).

1. Google Cloud Console → create an OAuth client ID (type: Web application).
2. Authorised redirect URI: `https://duteuggmjqbselwotfqf.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Sign In / Providers → Google: paste the client ID and secret, and enable it.

## Making yourself admin

After signing in once, run this in the SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

The "Admin" link then appears on `/akaun`, and `/admin` stops returning 404.
