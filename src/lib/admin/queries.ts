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
>;

export async function getAdminVendor(
  pasarId: string,
  vendorId: string,
): Promise<AdminVendor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select(
      "id, pasar_id, slug, name, category_id, description, price_range, photos, usual_days, status",
    )
    .eq("id", vendorId)
    .eq("pasar_id", pasarId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load stall: ${error.message}`);
  return data;
}
