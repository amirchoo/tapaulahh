import "server-only";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export type AuthSettings = {
  /** Google sign-in is switched on (show the button). */
  googleEnabled: boolean;
  /** New accounts must confirm their email with a code before signing in. */
  confirmsEmail: boolean;
};

/**
 * What's switched on in Supabase Auth, read from its public settings so the
 * forms match without a deploy. Cached for 5 minutes.
 */
export async function getAuthSettings(): Promise<AuthSettings> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(String(res.status));
    const settings: {
      external?: { google?: boolean };
      mailer_autoconfirm?: boolean;
    } = await res.json();
    return {
      googleEnabled: settings.external?.google === true,
      confirmsEmail: settings.mailer_autoconfirm !== true,
    };
  } catch {
    return { googleEnabled: false, confirmsEmail: true };
  }
}
