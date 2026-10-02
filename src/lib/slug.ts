/** "seksyen-7" → "Seksyen 7". */
export function titleFromSlug(slug: string): string {
  return decodeURIComponent(slug)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** "Pasar Malam Seksyen 7 (Shah Alam)" → "pasar-malam-seksyen-7-shah-alam". */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Same rule as the slug CHECK constraint in the database. */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
