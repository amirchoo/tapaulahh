import "server-only";
import { SAMPLE_PASARS } from "./sample-data";
import type { Pasar } from "./types";

/** Active pasars with their schedules. Part 2 replaces this with a Supabase query. */
export async function getPasars(): Promise<Pasar[]> {
  return SAMPLE_PASARS;
}
