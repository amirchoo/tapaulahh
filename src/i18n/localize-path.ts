import { routing, type Locale } from "./routing";

type PathnameValue = (typeof routing.pathnames)[keyof typeof routing.pathnames];

function pathFor(value: PathnameValue, locale: Locale): string {
  return typeof value === "string" ? value : value[locale];
}

/** "/pasar/[slug]" → /^\/pasar\/([^/]+)$/ with capture names ["slug"]. */
function compile(template: string) {
  const names: string[] = [];
  const source = template
    .split("/")
    .map((part) => {
      const param = part.match(/^\[(.+)\]$/);
      if (!param) return part.replace(/[.*+?^${}()|\\]/g, "\\$&");
      names.push(param[1]);
      return "([^/]+)";
    })
    .join("/");
  return { regex: new RegExp(`^${source}$`), names };
}

/**
 * Turns a real default-locale (BM) path into the same page's path in another
 * locale, e.g. ("/cari", "en") → "/search". Unknown paths come back unchanged.
 * The result has no locale prefix.
 */
export function translateDefaultPath(pathname: string, locale: Locale): string {
  for (const value of Object.values(routing.pathnames)) {
    const { regex, names } = compile(pathFor(value, routing.defaultLocale));
    const match = pathname.match(regex);
    if (!match) continue;
    return names.reduce(
      (path, name, i) => path.replace(`[${name}]`, match[i + 1]),
      pathFor(value, locale),
    );
  }
  return pathname;
}
