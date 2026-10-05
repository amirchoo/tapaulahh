import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Tables = Database["public"]["Tables"];
type Schedule = { day_of_week: number; start_time: string; end_time: string };

// Admin reads go through the signed-in client: RLS lets admins see every
// status (inactive pasars, pending stalls), and nothing here is cached.

export type AdminPasarSummary = Pick<
  Tables["pasars"]["Row"],
  "id" | "slug" | "name" | "district" | "state" | "status"
> & { days: number[]; vendorCount: number };

export async function getAdminPasars(): Promise<AdminPasarSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pasars")
    .select(
      "id, slug, name, district, state, status, pasar_schedules (day_of_week), vendors (count)",
    )
    .order("name");
  if (error) throw new Error(`Failed to load pasars: ${error.message}`);
  return data.map(({ pasar_schedules, vendors, ...pasar }) => ({
    ...pasar,
    days: [...new Set(pasar_schedules.map((s) => s.day_of_week))],
    vendorCount: vendors[0]?.count ?? 0,
  }));
}

export type AdminPasar = Pick<
  Tables["pasars"]["Row"],
  | "id"
  | "slug"
  | "name"
  | "description"
  | "address"
  | "district"
  | "state"
  | "parking_notes"
  | "photos"
  | "status"
  | "lat"
  | "lng"
> & {
  schedules: Schedule[];
  vendors: AdminVendorSummary[];
};

export type AdminVendorSummary = Pick<
  Tables["vendors"]["Row"],
  "id" | "slug" | "name" | "status" | "usual_days"
> & { categoryName: string | null };

export async function getAdminPasar(id: string): Promise<AdminPasar | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pasars")
    .select(
      "id, slug, name, description, address, district, state, parking_notes, photos, status, lat, lng, pasar_schedules (day_of_week, start_time, end_time), vendors (id, slug, name, status, usual_days, vendor_categories (name_ms))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load pasar: ${error.message}`);
  if (!data) return null;
  const { pasar_schedules, vendors, ...pasar } = data;
  return {
    ...pasar,
    schedules: pasar_schedules,
    vendors: vendors
      .map(({ vendor_categories, ...v }) => ({
        ...v,
        categoryName: vendor_categories?.name_ms ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export type AdminVendor = Pick<
  Tables["vendors"]["Row"],
  | "id"
  | "pasar_id"
  | "slug"
  | "name"
  | "category_id"
  | "description"
  | "price_range"
  | "photos"
  | "usual_days"
  | "status"
> & { items: AdminVendorItem[] };

export type AdminVendorItem = Pick<
  Tables["vendor_items"]["Row"],
  "id" | "name" | "description" | "price_rm" | "photo_url" | "is_available"
>;

export async function getAdminVendor(
  pasarId: string,
  vendorId: string,
): Promise<AdminVendor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select(
      "id, pasar_id, slug, name, category_id, description, price_range, photos, usual_days, status, vendor_items (id, name, description, price_rm, photo_url, is_available, sort_order, created_at)",
    )
    .eq("id", vendorId)
    .eq("pasar_id", pasarId)
    .order("sort_order", { referencedTable: "vendor_items" })
    .order("created_at", { referencedTable: "vendor_items" })
    .maybeSingle();
  if (error) throw new Error(`Failed to load stall: ${error.message}`);
  if (!data) return null;
  const { vendor_items, ...vendor } = data;
  return {
    ...vendor,
    // Already sorted by sort_order; the menu editor only needs these fields.
    items: vendor_items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price_rm: item.price_rm,
      photo_url: item.photo_url,
      is_available: item.is_available,
    })),
  };
}

export type AdminBusiness = Pick<
  Tables["home_businesses"]["Row"],
  | "id"
  | "slug"
  | "name"
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
  | "created_at"
> & {
  ownerName: string | null;
  categoryName: string | null;
  /** The private exact spot, so an admin can check it. */
  location: { lat: number; lng: number } | null;
  itemCount: number;
};

/** All Peniaga Kecil businesses, pending first, then newest. */
export async function getAdminBusinesses(): Promise<AdminBusiness[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_businesses")
    .select(
      "id, slug, name, description, district, state, whatsapp, instagram, hours, delivery_notes, logo_url, status, review_note, created_at, profiles (display_name), business_categories (name_ms), home_business_locations (lat, lng), catalog_items (count)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load businesses: ${error.message}`);
  const rank = { pending: 0, rejected: 1, approved: 2 } as const;
  return data
    .map(
      ({
        profiles,
        business_categories,
        home_business_locations: loc,
        catalog_items,
        ...b
      }) => ({
        ...b,
        ownerName: profiles?.display_name ?? null,
        categoryName: business_categories?.name_ms ?? null,
        location:
          loc && loc.lat !== null && loc.lng !== null
            ? { lat: loc.lat, lng: loc.lng }
            : null,
        itemCount: catalog_items[0]?.count ?? 0,
      }),
    )
    .sort((a, b) => rank[a.status] - rank[b.status]);
}
