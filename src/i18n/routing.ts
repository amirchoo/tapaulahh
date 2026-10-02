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
  // Folders are in BM; English gets translated paths. "pasar" and "kedai" are
  // brand words and stay the same. Every new page needs an entry here.
  pathnames: {
    "/": "/",
    "/pasar": "/pasar",
    "/pasar/[slug]": "/pasar/[slug]",
    "/pasar/[slug]/[vendor]": "/pasar/[slug]/[vendor]",
    "/kedai": "/kedai",
    "/kedai/[slug]": "/kedai/[slug]",
    "/cari": { ms: "/cari", en: "/search" },
    "/login": "/login",
    "/daftar": { ms: "/daftar", en: "/sign-up" },
    "/akaun": { ms: "/akaun", en: "/account" },
    "/akaun/selamat-datang": {
      ms: "/akaun/selamat-datang",
      en: "/account/welcome",
    },
    "/akaun/kedai": { ms: "/akaun/kedai", en: "/account/shop" },
    "/admin": "/admin",
    "/admin/pasar/baru": { ms: "/admin/pasar/baru", en: "/admin/pasar/new" },
    "/admin/pasar/[id]": "/admin/pasar/[id]",
    "/admin/pasar/[id]/gerai/baru": {
      ms: "/admin/pasar/[id]/gerai/baru",
      en: "/admin/pasar/[id]/stalls/new",
    },
    "/admin/pasar/[id]/gerai/[vendorId]": {
      ms: "/admin/pasar/[id]/gerai/[vendorId]",
      en: "/admin/pasar/[id]/stalls/[vendorId]",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
export type Pathname = keyof typeof routing.pathnames;

export const LOCALE_COOKIE = "tapau_locale";
