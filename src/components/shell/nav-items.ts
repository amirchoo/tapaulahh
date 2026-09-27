import { House, Map, Store, UserRound, type LucideIcon } from "lucide-react";

export type NavKey = "utama" | "pasar" | "kedai" | "akaun";

export type NavItem = {
  key: NavKey;
  href: "/" | "/pasar" | "/kedai" | "/akaun";
  icon: LucideIcon;
  /** Section identity colour when active (VISION §9). */
  section: "pasar" | "kedai" | "neutral";
};

export const NAV_ITEMS: NavItem[] = [
  { key: "utama", href: "/", icon: House, section: "neutral" },
  { key: "pasar", href: "/pasar", icon: Map, section: "pasar" },
  { key: "kedai", href: "/kedai", icon: Store, section: "kedai" },
  { key: "akaun", href: "/akaun", icon: UserRound, section: "neutral" },
];

/** `pathname` is locale-free (from next-intl's usePathname). */
export function activeNavKey(pathname: string): NavKey | null {
  const is = (base: string) =>
    pathname === base || pathname.startsWith(`${base}/`);

  // Search lives at the top of the home page, so /cari counts as Utama.
  if (pathname === "/" || is("/cari")) return "utama";
  if (is("/pasar")) return "pasar";
  if (is("/kedai")) return "kedai";
  if (is("/akaun") || is("/login")) return "akaun";
  return null;
}
