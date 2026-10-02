"use server";

import type { AuthError } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { safeNextPath } from "@/lib/auth/next-path";
import { NAME_MAX } from "@/lib/auth/profile-name";
import { getCurrentUser, pathAfterSignIn } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** This site's origin (localhost, a Vercel preview, or production). */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Where to go after signing in: the form's `next`, or My account. */
async function nextFrom(formData: FormData): Promise<string> {
  const locale = await getLocale();
  return (
    safeNextPath(formData.get("next")) ??
    getPathname({ href: "/akaun", locale })
  );
}

async function callbackUrl(next: string): Promise<string> {
  return `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
}

// ---------------------------------------------------------------------------
// Email code (also works as a link): one form, two steps.
// ---------------------------------------------------------------------------

export type LoginError =
  "invalidEmail" | "nameRequired" | "invalidCode" | "rateLimit" | "generic";

export type LoginState = {
  step: "email" | "code";
  email: string;
  name: string;
  error?: LoginError;
  /** When the last code was sent (ms), for the resend countdown. */
  sentAt?: number;
  resent?: boolean;
};

function sendError(error: AuthError): LoginError {
  if (error.status === 429 || error.code?.includes("rate_limit")) {
    return "rateLimit";
  }
  if (error.code === "email_address_invalid") return "invalidEmail";
  return "generic";
}

/**
 * intent = "send" | "resend" | "verify" | "change". Signing in with an email
 * that has no account yet creates one (profiles row via the DB trigger).
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const intent = formData.get("intent");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "")
    .trim()
    .slice(0, NAME_MAX);
  const next = await nextFrom(formData);

  if (intent === "change") return { step: "email", email, name };

  const supabase = await createClient();

  if (intent === "verify") {
    const token = String(formData.get("code") ?? "").replace(/\D/g, "");
    if (token.length < 6) {
      return { step: "code", email, name, error: "invalidCode" };
    }
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error || !data.user) {
      const code = error?.status === 429 ? "rateLimit" : "invalidCode";
      return { step: "code", email, name, error: code };
    }
    redirect(await pathAfterSignIn(data.user.id, next, await getLocale()));
  }

  // "send" or "resend"
  const failStep = intent === "resend" ? "code" : "email";
  if (!EMAIL_RE.test(email)) {
    return { step: "email", email, name, error: "invalidEmail" };
  }
  if (formData.get("mode") === "signup" && !name) {
    return { step: "email", email, name, error: "nameRequired" };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: await callbackUrl(next),
      // Only used when this creates the account: becomes profiles.display_name.
      data: name ? { full_name: name } : undefined,
    },
  });
  if (error) return { step: failStep, email, name, error: sendError(error) };

  return {
    step: "code",
    email,
    name,
    sentAt: Date.now(),
    resent: intent === "resend",
  };
}

// ---------------------------------------------------------------------------
// Google
// ---------------------------------------------------------------------------

export async function googleAction(formData: FormData) {
  const next = await nextFrom(formData);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(next) },
  });
  if (error || !data.url) {
    redirect(
      getPathname({
        href: { pathname: "/login", query: { error: "google", next } },
        locale: await getLocale(),
      }),
    );
  }
  redirect(data.url);
}

// ---------------------------------------------------------------------------
// Profile name (welcome step and My account)
// ---------------------------------------------------------------------------

export type NameState = {
  saved?: boolean;
  error?: "nameRequired" | "generic";
};

export async function saveNameAction(
  _prev: NameState,
  formData: FormData,
): Promise<NameState> {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect(getPathname({ href: "/login", locale }));

  const name = String(formData.get("name") ?? "")
    .trim()
    .slice(0, NAME_MAX);
  if (!name) return { error: "nameRequired" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("id", user.id);
  if (error) return { error: "generic" };

  const next = safeNextPath(formData.get("next"));
  if (next) redirect(next);
  refresh();
  return { saved: true };
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(getPathname({ href: "/", locale: await getLocale() }));
}
