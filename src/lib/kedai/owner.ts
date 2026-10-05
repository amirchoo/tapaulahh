import "server-only";
import type { MenuItem } from "@/components/admin/menu-editor";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Row = Database["public"]["Tables"]["home_businesses"]["Row"];

/** The signed-in owner's own business (any status), for /akaun/kedai. */
export type OwnerBusiness = Pick<
  Row,
  | "id"
  | "slug"
  | "name"
  | "category_id"
  | "description"
  | "district"
  | "state"
  | "whatsapp"
  | "instagram"
  | "hours"
  | "delivery_notes"
  | "logo_url"
  | "status"
  | "review_note"
> & {
  /** Private exact location (only the owner and admins can read it). */
  location: { lat: number; lng: number; address: string | null } | null;
  items: MenuItem[];
};

/** One business per account for now; returns the first if there are more. */
export async function getMyBusiness(
  userId: string,
): Promise<OwnerBusiness | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_businesses")
    .select(
      "id, slug, name, category_id, description, district, state, whatsapp, instagram, hours, delivery_notes, logo_url, status, review_note, home_business_locations (lat, lng, address), catalog_items (id, name, description, price_rm, photo_url, is_available, sort_order, created_at)",
    )
    .eq("owner_id", userId)
    .order("created_at")
    .order("sort_order", { referencedTable: "catalog_items" })
    .order("created_at", { referencedTable: "catalog_items" })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load your business: ${error.message}`);
  if (!data) return null;

  const { home_business_locations: loc, catalog_items, ...business } = data;
  return {
    ...business,
    location:
      loc && loc.lat !== null && loc.lng !== null
        ? { lat: loc.lat, lng: loc.lng, address: loc.address }
        : null,
    items: catalog_items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price_rm: i.price_rm,
      photo_url: i.photo_url,
      is_available: i.is_available,
    })),
  };
}
