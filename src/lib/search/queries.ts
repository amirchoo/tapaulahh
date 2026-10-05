import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";
import { queryVariants } from "./aliases";

type Kind = Database["public"]["Enums"]["content_type"];

export type SearchHit = {
  kind: Kind;
  id: string;
  slug: string;
  name: string;
  /** Area for pasars and businesses; the pasar's name for stalls. */
  context: string | null;
  /** The pasar's slug, for stall links. */
  parentSlug: string | null;
  score: number;
  photo: string | null;
};

export const SEARCH_MAX = 80;

/**
 * Pasars, stalls (also by their menu) and businesses matching the query or
 * any of its alternative spellings, best first. Uses the search_all RPC.
 */
export async function search(query: string): Promise<SearchHit[]> {
  const q = query.trim().slice(0, SEARCH_MAX);
  if (q.length < 2) return [];
  const supabase = createPublicClient();

  const results = await Promise.all(
    queryVariants(q).map((variant) =>
      supabase.rpc("search_all", { query: variant }),
    ),
  );

  // Merge variants: keep each result once, with its best score. The exact
  // query wins ties over an alias.
  const byId = new Map<string, SearchHit>();
  results.forEach(({ data, error }, i) => {
    if (error) throw new Error(`Search failed: ${error.message}`);
    for (const r of data) {
      const score = r.score - (i === 0 ? 0 : 0.05);
      const prev = byId.get(r.id);
      if (prev && prev.score >= score) continue;
      byId.set(r.id, {
        kind: r.kind,
        id: r.id,
        slug: r.slug,
        name: r.name,
        context: r.context,
        parentSlug: r.parent_slug,
        score,
        photo: null,
      });
    }
  });
  const hits = [...byId.values()].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  );
  await addPhotos(hits);
  return hits;
}

/** Thumbnails: a pasar's first photo, a stall's cover, a business's logo. */
async function addPhotos(hits: SearchHit[]) {
  const ids = (kind: Kind) =>
    hits.filter((h) => h.kind === kind).map((h) => h.id);
  const supabase = createPublicClient();
  const [pasars, vendors, businesses] = await Promise.all([
    ids("pasar").length
      ? supabase.from("pasars").select("id, photos").in("id", ids("pasar"))
      : null,
    ids("vendor").length
      ? supabase
          .from("vendors")
          .select("id, photos, vendor_items (photo_url)")
          .in("id", ids("vendor"))
          .not("vendor_items.photo_url", "is", null)
          .order("sort_order", { referencedTable: "vendor_items" })
          .limit(1, { referencedTable: "vendor_items" })
      : null,
    ids("business").length
      ? supabase
          .from("home_businesses")
          .select("id, logo_url")
          .in("id", ids("business"))
      : null,
  ]);

  const photo = new Map<string, string | null>();
  for (const p of pasars?.data ?? []) photo.set(p.id, p.photos[0] ?? null);
  for (const v of vendors?.data ?? []) {
    photo.set(v.id, v.photos[0] ?? v.vendor_items[0]?.photo_url ?? null);
  }
  for (const b of businesses?.data ?? []) photo.set(b.id, b.logo_url);
  for (const hit of hits) hit.photo = photo.get(hit.id) ?? null;
}
