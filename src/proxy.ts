import createMiddleware from "next-intl/middleware";
import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, routing } from "@/i18n/routing";

const handleI18n = createMiddleware(routing);

export default function proxy(request: NextRequest) {
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
    url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return handleI18n(request);
}

export const config = {
  // Skip API routes, Next internals and anything with a file extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
