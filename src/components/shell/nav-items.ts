import { House, Map, Search, UserRound, type LucideIcon } from "lucide-react";

export type NavKey = "pasar" | "kedai" | "cari" | "akaun";

export type NavItem = {
  key: NavKey;
  href: "/" | "/kedai" | "/cari" | "/akaun";
  icon: LucideIcon;
  /** Section identity colour when active (VISION §9). */
  section: "pasar" | "kedai" | "neutral";
};

export const NAV_ITEMS: NavItem[] = [
  { key: "pasar", href: "/", icon: Map, section: "pasar" },
  { key: "kedai", href: "/kedai", icon: House, section: "kedai" },
  { key: "cari", href: "/cari", icon: Search, section: "neutral" },
  { key: "akaun", href: "/akaun", icon: UserRound, section: "neutral" },
];

/** `pathname` is locale-free (from next-intl's usePathname). */
export function activeNavKey(pathname: string): NavKey | null {
  const is = (base: string) =>
    pathname === base || pathname.startsWith(`${base}/`);

  if (pathname === "/" || is("/pasar")) return "pasar";
  if (is("/kedai")) return "kedai";
  if (is("/cari")) return "cari";
  if (is("/akaun") || is("/login")) return "akaun";
  return null;
}
