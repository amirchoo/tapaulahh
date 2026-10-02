import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";
import { translateDefaultPath } from "@/i18n/localize-path";
import { LOCALE_COOKIE, routing } from "@/i18n/routing";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const handleI18n = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  const preferred = request.cookies.get(LOCALE_COOKIE)?.value;

  // Unprefixed (BM) URL, but the user chose another language earlier.
  if (
    !hasPrefix &&
    preferred !== routing.defaultLocale &&
    hasLocale(routing.locales, preferred)
  ) {
    const url = request.nextUrl.clone();
    const localized = translateDefaultPath(pathname, preferred);
    url.pathname = `/${preferred}${localized === "/" ? "" : localized}`;
    return NextResponse.redirect(url);
  }

  return refreshSession(request, handleI18n(request));
}

/**
 * Keeps a signed-in user's session fresh: if their access token has expired,
 * Supabase swaps it for a new one and we write the new cookies. Visitors who
 * never signed in have no Supabase cookies, so this does nothing for them.
 */
async function refreshSession(request: NextRequest, response: NextResponse) {
  const hasSession = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-"));
  if (!hasSession) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Stops CDNs caching a response that carries someone's session.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Skip API routes, auth callbacks, Next internals and anything with a file extension.
  matcher: "/((?!api|auth/|_next|_vercel|.*\\..*).*)",
};
