import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { DayOfWeek, Pasar } from "./types";

/** "17:00:00" (Postgres time) → "17:00". */
const toHHMM = (time: string) => time.slice(0, 5);

/** Active pasars with their schedules. Empty until real data is added. */
export async function getPasars(): Promise<Pasar[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("pasars")
    .select(
      "id, slug, name, address, district, state, lat, lng, pasar_schedules (day_of_week, start_time, end_time)",
    )
    .eq("status", "active")
    .order("name");

  if (error) throw new Error(`Failed to load pasars: ${error.message}`);

  // lat/lng are generated from a NOT NULL column, so never null in practice.
  return data.flatMap((row) =>
    row.lat === null || row.lng === null
      ? []
      : [
          {
            id: row.id,
            slug: row.slug,
            name: row.name,
            address: row.address ?? "",
            district: row.district,
            state: row.state,
            location: { lat: row.lat, lng: row.lng },
            schedules: row.pasar_schedules.map((s) => ({
              // The table's CHECK constraint keeps this within 0–6.
              dayOfWeek: s.day_of_week as DayOfWeek,
              startTime: toHHMM(s.start_time),
              endTime: toHHMM(s.end_time),
            })),
          },
        ],
  );
}
