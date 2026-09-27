"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getPathname, usePathname } from "@/i18n/navigation";
import { LOCALE_COOKIE, type Locale } from "@/i18n/routing";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function LanguageToggle() {
  const t = useTranslations("Language");
  const locale = useLocale();
  const pathname = usePathname();

  const next: Locale = locale === "ms" ? "en" : "ms";

  function switchLocale() {
    // Read by src/proxy.ts so unprefixed URLs open in the chosen language.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    // Full load rather than router.replace: the client segment cache keeps the
    // old locale's route tree and its prefetches 404 after a soft switch.
    const target = getPathname({ href: pathname, locale: next });
    window.location.assign(
      target + window.location.search + window.location.hash,
    );
  }

  return (
    <Button
      variant="ghost"
      className="h-11 min-w-11 px-2 text-sm font-bold"
      onClick={switchLocale}
      aria-label={t("label")}
      title={t("label")}
      lang={next}
    >
      {t("short")}
    </Button>
  );
}
