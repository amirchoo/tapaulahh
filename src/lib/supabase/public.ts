import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/** Cache tag for public Supabase reads. revalidateTag(PUBLIC_DATA_TAG) after admin edits. */
export const PUBLIC_DATA_TAG = "public-data";

/** How long public data may be served from Next's data cache, in seconds. */
export const PUBLIC_DATA_REVALIDATE = 300;

/**
 * Anonymous, cookie-free client for public data (pasars, approved shops).
 * Reading no cookies keeps pages static, so they can be cached and revalidated.
 * RLS limits it to what any visitor may see.
 */
export function createPublicClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Make Next's data cache explicit: shared, time-limited, and taggable.
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: { revalidate: PUBLIC_DATA_REVALIDATE, tags: [PUBLIC_DATA_TAG] },
        }),
    },
  });
}
