import "server-only";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Whether Google sign-in is switched on in the Supabase dashboard, so the
 * button only shows once it works. Cached for an hour.
 */
export async function isGoogleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return false;
    const settings: { external?: { google?: boolean } } = await res.json();
    return settings.external?.google === true;
  } catch {
    return false;
  }
}
