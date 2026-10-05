import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  DayOfWeek,
  Pasar,
  PasarDetail,
  Vendor,
  VendorCategory,
  VendorDetail,
} from "./types";

/** "17:00:00" (Postgres time) → "17:00". */
const toHHMM = (time: string) => time.slice(0, 5);

const PASAR_FIELDS =
  "id, slug, name, address, district, state, lat, lng, pasar_schedules (day_of_week, start_time, end_time)";

type PasarRow = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  district: string;
  state: string;
  lat: number | null;
  lng: number | null;
  pasar_schedules: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[];
};

// lat/lng are generated from a NOT NULL column, so never null in practice.
function toPasar(row: PasarRow): Pasar | null {
  if (row.lat === null || row.lng === null) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address ?? "",
    district: row.district,
    state: row.state,
    location: { lat: row.lat, lng: row.lng },
    schedules: row.pasar_schedules.map((s) => ({
      // The table's CHECK constraint keeps this within 0 to 6.
      dayOfWeek: s.day_of_week as DayOfWeek,
      startTime: toHHMM(s.start_time),
      endTime: toHHMM(s.end_time),
    })),
  };
}

/** Active pasars with their schedules. */
export async function getPasars(): Promise<Pasar[]> {
  const { data, error } = await createPublicClient()
    .from("pasars")
    .select(PASAR_FIELDS)
    .eq("status", "active")
    .order("name");
  if (error) throw new Error(`Failed to load pasars: ${error.message}`);
  return data.flatMap((row) => toPasar(row) ?? []);
}

/** One active pasar by its URL slug, or null. */
export async function getPasarBySlug(
  slug: string,
): Promise<PasarDetail | null> {
  const { data, error } = await createPublicClient()
    .from("pasars")
    .select(`${PASAR_FIELDS}, description, parking_notes, photos`)
    .eq("status", "active")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Failed to load pasar: ${error.message}`);
  const pasar = data && toPasar(data);
  if (!data || !pasar) return null;
  return {
    ...pasar,
    description: data.description,
    parkingNotes: data.parking_notes,
    photos: data.photos,
  };
}

const CATEGORY_FIELDS = "id, slug, name_ms, name_en, icon, sort_order";

type CategoryRow = {
  id: string;
  slug: string;
  name_ms: string;
  name_en: string;
  icon: string | null;
  sort_order: number;
};

function toCategory(row: CategoryRow): VendorCategory {
  return {
    id: row.id,
    slug: row.slug,
    nameMs: row.name_ms,
    nameEn: row.name_en,
    icon: row.icon,
    sortOrder: row.sort_order,
  };
}

export async function getVendorCategories(): Promise<VendorCategory[]> {
  const { data, error } = await createPublicClient()
    .from("vendor_categories")
    .select(CATEGORY_FIELDS)
    .order("sort_order");
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data.map(toCategory);
}

const VENDOR_FIELDS = `id, slug, name, description, price_range, photos, usual_days, vendor_categories (${CATEGORY_FIELDS})`;

type VendorRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_range: string | null;
  photos: string[];
  usual_days: number[];
  vendor_categories: CategoryRow | null;
};

function toVendor(row: VendorRow): Vendor {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.vendor_categories && toCategory(row.vendor_categories),
    description: row.description,
    priceRange: row.price_range,
    photos: row.photos,
    usualDays: row.usual_days as DayOfWeek[],
    coverPhoto: row.photos[0] ?? null,
  };
}

/** Active stalls at a pasar, by name. */
export async function getVendors(pasarId: string): Promise<Vendor[]> {
  const { data, error } = await createPublicClient()
    .from("vendors")
    // Plus the first menu photo, as a cover for stalls without their own.
    .select(`${VENDOR_FIELDS}, vendor_items (photo_url)`)
    .eq("pasar_id", pasarId)
    .eq("status", "active")
    .not("vendor_items.photo_url", "is", null)
    .order("name")
    .order("sort_order", { referencedTable: "vendor_items" })
    .limit(1, { referencedTable: "vendor_items" });
  if (error) throw new Error(`Failed to load stalls: ${error.message}`);
  return data.map((row) => {
    const vendor = toVendor(row);
    return {
      ...vendor,
      coverPhoto: vendor.coverPhoto ?? row.vendor_items[0]?.photo_url ?? null,
    };
  });
}

export async function getVendor(
  pasarId: string,
  slug: string,
): Promise<VendorDetail | null> {
  const { data, error } = await createPublicClient()
    .from("vendors")
    .select(
      `${VENDOR_FIELDS}, vendor_items (id, name, description, price_rm, photo_url, is_available, sort_order, created_at)`,
    )
    .eq("pasar_id", pasarId)
    .eq("slug", slug)
    .eq("status", "active")
    .order("sort_order", { referencedTable: "vendor_items" })
    .order("created_at", { referencedTable: "vendor_items" })
    .maybeSingle();
  if (error) throw new Error(`Failed to load stall: ${error.message}`);
  if (!data) return null;
  return {
    ...toVendor(data),
    items: data.vendor_items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      priceRm: item.price_rm,
      photoUrl: item.photo_url,
      isAvailable: item.is_available,
    })),
  };
}
