import { NextResponse, type NextRequest } from "next/server";
import { getPathname } from "@/i18n/navigation";
import { localeOfPath, safeNextPath } from "@/lib/auth/next-path";
import { pathAfterSignIn } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// "email" verifies both kinds of email token: a new account's (signup) and a
// returning user's (magiclink). Verifying with "magiclink" fails for new ones.
const EMAIL_TYPES = ["email", "magiclink", "signup"];

/**
 * Where sign-in links land:
 * - the email link (?token_hash=…&type=email), which works in any browser,
 *   e.g. when the email app opens its own;
 * - Google, and Supabase's default email link (?code=…), which must finish in
 *   the browser that started it.
 * Signs in, then redirects to `next` (or the welcome step for new accounts).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next")) ?? "/akaun";
  const locale = localeOfPath(next);

  const tokenHash = searchParams.get("token_hash");
  const isEmailLink = EMAIL_TYPES.includes(searchParams.get("type") ?? "");
  const code = searchParams.get("code");

  const supabase = await createClient();
  let userId: string | undefined;
  if (tokenHash && isEmailLink) {
    const { data } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    userId = data.user?.id;
  } else if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    userId = data.user?.id;
  }

  if (!userId) {
    // Google failures come back with ?error=…; anything else is a used or
    // expired email link.
    const isGoogle =
      searchParams.has("error") &&
      !searchParams.get("error_code")?.startsWith("otp");
    const loginPath = getPathname({
      href: {
        pathname: "/login",
        query: { error: isGoogle ? "google" : "link", next },
      },
      locale,
    });
    return NextResponse.redirect(new URL(loginPath, origin));
  }

  const destination = await pathAfterSignIn(userId, next, locale);
  return NextResponse.redirect(new URL(destination, origin));
}
