import { routing, type Locale } from "@/i18n/routing";

/**
 * Where to send someone after signing in. Only same-site paths are allowed
 * ("/akaun", "/en/account"), never "//evil.com" or full URLs.
 */
export function safeNextPath(
  value: FormDataEntryValue | string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\") || /[\r\n]/.test(value)) return null;
  return value;
}

/** The locale a (prefixed) path belongs to: "/en/account" → "en". */
export function localeOfPath(path: string | null): Locale {
  const prefixed = routing.locales.find(
    (locale) => path === `/${locale}` || path?.startsWith(`/${locale}/`),
  );
  return prefixed ?? routing.defaultLocale;
}
