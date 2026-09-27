/** "seksyen-7" → "Seksyen 7". Placeholder titles until real data (Part 4). */
export function titleFromSlug(slug: string): string {
  return decodeURIComponent(slug)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
