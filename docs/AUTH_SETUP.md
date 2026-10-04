# Sign-in setup (Supabase)

How accounts work, and the Supabase settings they rely on (project `duteuggmjqbselwotfqf`).

## The flows

| Page                                          | What happens                                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/daftar` (`/en/sign-up`)                     | Name + email + password → we email a **6-digit code** (and a link) → enter it → signed in, on to `next`. |
| `/login`                                      | Email + password. Not confirmed yet? We send the confirm code and show the code step.                    |
| `/login` → "Log masuk guna kod email"         | Email → code → in. For people who signed up before passwords existed. Doesn't create accounts.           |
| `/lupa-kata-laluan` (`/en/forgot-password`)   | Email → reset code (or link) → `/akaun/kata-laluan` to pick a new password.                              |
| `/akaun/kata-laluan` (`/en/account/password`) | Set or change the password while signed in (also linked from My account).                                |
| Google (once switched on)                     | Google → `/auth/callback` → on to `next`.                                                                |

Codes and links do the same thing. The code is there because email apps on phones often open links in their own browser, which would sign the person in there instead of in their real browser.

| File                                 | What it does                                                          |
| ------------------------------------ | --------------------------------------------------------------------- |
| `src/lib/auth/actions.ts`            | Server actions: sign up, log in, codes, forgot/set password, log out  |
| `src/lib/auth/session.ts`            | `getCurrentUser()`, `getProfile()`, `requireUser()`, `requireAdmin()` |
| `src/app/auth/callback/route.ts`     | Where email links (`type=email` / `type=recovery`) and Google land    |
| `src/components/auth/login-form.tsx` | The form for all three pages, plus the code step                      |
| `src/proxy.ts`                       | Refreshes the session cookie for signed-in visitors                   |
| `supabase/templates/*.html`          | The three emails (BM + English)                                       |

## Supabase settings (already applied to the cloud project, 2026-10-03)

These were set through the Management API. If anything changes, update both the dashboard and `supabase/config.toml`.

- **Site URL:** `https://tapaulahh.vercel.app` (change to `https://tapaulahh.com` at launch)
- **Redirect URLs:** `http://localhost:3000/**`, `https://tapaulahh.vercel.app/**`, `https://tapaulahh-*.vercel.app/**` (Vercel previews). Email links go back to whichever site sent them; a site missing from this list gets sent to the Site URL instead. (Before this was set, every link went to `localhost:3000`.)
- **Emails** (Authentication → Emails):
  - Confirm signup → `supabase/templates/confirm-signup.html`, subject `Sahkan akaun Tapaulahh Anda: {{ .Token }}`
  - Magic link → `supabase/templates/sign-in.html`, subject `Kod log masuk Tapaulahh: {{ .Token }}`
  - Reset password → `supabase/templates/reset-password.html`, subject `Reset kata laluan Tapaulahh: {{ .Token }}`
- **Email OTP length:** 6. **Minimum password length:** 8.
- **Confirm email: OFF for now (2026-10-04)**, as a stop-gap until custom SMTP is set up. Sign-up logs people straight in; the sign-up page hides the "we'll email you a code" line automatically (it reads Supabase's public settings, cached 5 minutes). Forgot password and the email-code log-in still need SMTP. After SMTP works, turn it back on: Authentication → Sign In / Providers → Email → **Confirm email**.

## Before real users: email sending (needed)

Supabase's built-in email sender is for testing only: about **2 emails per hour for the whole project**, and only to members of the Supabase organisation. Past that, sign-up and "forgot password" show "We couldn't send the email right now".

Set up custom SMTP: Authentication → Emails → SMTP settings. [Resend](https://resend.com) has a free tier (3,000 emails a month); verify the `tapaulahh.com` domain there and send from something like `hai@tapaulahh.com`. Then raise the email rate limit (Authentication → Rate Limits).

## Google sign-in (optional, any time)

The "Continue with Google" button appears on its own once Google is switched on (the login page checks Supabase's settings, cached for an hour).

1. Google Cloud Console → create an OAuth client ID (type: Web application).
2. Authorised redirect URI: `https://duteuggmjqbselwotfqf.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Sign In / Providers → Google: paste the client ID and secret, and enable it.

## Making someone admin

After they've signed up, run this in the SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'them@example.com');
```
