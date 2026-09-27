import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ms", "en"],
  defaultLocale: "ms",
  // BM has no prefix, English lives under /en.
  localePrefix: "as-needed",
  // Most Malaysian browsers send English in Accept-Language, which would push
  // nearly everyone to /en. We only switch when the user picks a language
  // (remembered in LOCALE_COOKIE, handled in src/proxy.ts).
  localeDetection: false,
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_COOKIE = "tapau_locale";
