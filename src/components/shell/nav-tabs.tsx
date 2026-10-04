"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, activeNavKey, type NavItem } from "./nav-items";

const ACTIVE_TEXT: Record<NavItem["section"], string> = {
  pasar: "text-pasar-text",
  kedai: "text-kedai",
  neutral: "text-foreground",
};

const ACTIVE_BAR: Record<NavItem["section"], string> = {
  pasar: "bg-pasar",
  kedai: "bg-kedai",
  neutral: "bg-foreground",
};

/** Desktop: horizontal tabs in the top nav. */
export function TopNavTabs() {
  const t = useTranslations("Nav");
  const active = activeNavKey(usePathname());

  return (
    <nav aria-label={t("main")}>
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex h-14 items-center gap-2 px-3 text-sm font-semibold text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive && ACTIVE_TEXT[item.section],
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {t(item.key)}
                {isActive && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-3 bottom-0 h-0.5",
                      ACTIVE_BAR[item.section],
                    )}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile: bottom tab bar. */
export function BottomTabBar() {
  const t = useTranslations("Nav");
  const active = activeNavKey(usePathname());

  return (
    <nav
      aria-label={t("main")}
      className="border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                  isActive && ACTIVE_TEXT[item.section],
                )}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-6 top-0 h-0.5",
                      ACTIVE_BAR[item.section],
                    )}
                  />
                )}
                <item.icon className="size-5" aria-hidden />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
