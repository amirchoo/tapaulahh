import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Business, BusinessCategory } from "./types";

type CategoryRow = {
  id: string;
  slug: string;
  name_ms: string;
  name_en: string;
  icon: string | null;
  sort_order: number;
};

const toCategory = (row: CategoryRow): BusinessCategory => ({
  id: row.id,
  slug: row.slug,
  nameMs: row.name_ms,
  nameEn: row.name_en,
  icon: row.icon,
  sortOrder: row.sort_order,
});

/** Approved businesses with their fuzzed area (never the exact location). */
export async function getBusinesses(): Promise<Business[]> {
  const { data, error } = await createPublicClient()
    .from("home_businesses")
    .select(
      "id, slug, name, description, district, state, logo_url, public_lat, public_lng, business_categories (id, slug, name_ms, name_en, icon, sort_order)",
    )
    .eq("status", "approved")
    .order("name");
  if (error) throw new Error(`Failed to load businesses: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    district: row.district,
    state: row.state,
    logoUrl: row.logo_url,
    category: row.business_categories && toCategory(row.business_categories),
    area:
      row.public_lat !== null && row.public_lng !== null
        ? { lat: row.public_lat, lng: row.public_lng }
        : null,
  }));
}
