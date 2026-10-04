"use server";

import type { AuthError } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { safeNextPath } from "@/lib/auth/next-path";
import { NAME_MAX, PASSWORD_MIN } from "@/lib/auth/profile-name";
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
// Sign up, log in, forgot password: a form step, then (if needed) a code step.
// ---------------------------------------------------------------------------

export type LoginError =
  | "invalidEmail"
  | "nameRequired"
  | "passwordShort"
  | "wrongPassword"
  | "emailTaken"
  | "noAccount"
  | "invalidCode"
  | "rateLimit"
  | "emailNotSent"
  | "generic";

/** What the emailed code is for. */
export type CodePurpose = "signup" | "login" | "recovery";

export type LoginState = {
  step: "form" | "code";
  purpose: CodePurpose;
  email: string;
  name: string;
  error?: LoginError;
  /** When the last code was sent (ms), for the resend countdown. */
  sentAt?: number;
  resent?: boolean;
};

const PURPOSES: CodePurpose[] = ["signup", "login", "recovery"];

function authError(error: AuthError): LoginError {
  // The project's hourly email allowance is used up, or its mail server
  // refused the address: not the person's fault, so say so.
  if (
    error.code === "over_email_send_rate_limit" ||
    error.code === "email_address_not_authorized" ||
    error.code === "unexpected_failure"
  ) {
    return "emailNotSent";
  }
  if (error.status === 429 || error.code?.includes("rate_limit")) {
    return "rateLimit";
  }
  switch (error.code) {
    case "email_address_invalid":
      return "invalidEmail";
    case "weak_password":
      return "passwordShort";
    case "user_already_exists":
    case "email_exists":
      return "emailTaken";
    case "invalid_credentials":
      return "wrongPassword";
    case "otp_disabled":
    case "user_not_found":
    case "signup_disabled":
      return "noAccount";
    default:
      return "generic";
  }
}

/** Sends (or re-sends) the code for `purpose`. */
async function sendCode(
  purpose: CodePurpose,
  email: string,
  next: string,
): Promise<AuthError | null> {
  const supabase = await createClient();
  const redirectTo = await callbackUrl(next);
  if (purpose === "signup") {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });
    return error;
  }
  if (purpose === "recovery") {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return error;
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // Accounts are made on /daftar (with a password), not by asking for a code.
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  });
  return error;
}

/**
 * intent:
 * - "signup"   name + email + password → confirm-email code
 * - "password" email + password → in (or the confirm code if never confirmed)
 * - "send"     email → log-in code (for people without a password)
 * - "forgot"   email → reset code → set a new password
 * - "verify"   the code from the email
 * - "resend" / "change" on the code step
 */
export async function loginAction(
  prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const intent = formData.get("intent");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "")
    .trim()
    .slice(0, NAME_MAX);
  const password = String(formData.get("password") ?? "");
  const next = await nextFrom(formData);
  const locale = await getLocale();
  const purpose =
    PURPOSES.find((p) => p === formData.get("purpose")) ?? prev.purpose;
  const base = { email, name, purpose };

  if (intent === "change") return { step: "form", ...base };

  const supabase = await createClient();

  if (intent === "verify") {
    const token = String(formData.get("code") ?? "").replace(/\D/g, "");
    if (token.length < 6)
      return { step: "code", ...base, error: "invalidCode" };
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: purpose === "recovery" ? "recovery" : "email",
    });
    if (error || !data.user) {
      const code = error?.status === 429 ? "rateLimit" : "invalidCode";
      return { step: "code", ...base, error: code };
    }
    if (purpose === "recovery") {
      redirect(
        getPathname({
          href: { pathname: "/akaun/kata-laluan", query: { next } },
          locale,
        }),
      );
    }
    redirect(await pathAfterSignIn(data.user.id, next, locale));
  }

  if (intent === "resend") {
    const error = await sendCode(purpose, email, next);
    if (error) return { step: "code", ...base, error: authError(error) };
    return { step: "code", ...base, sentAt: Date.now(), resent: true };
  }

  // The form step.
  if (!EMAIL_RE.test(email)) {
    return { step: "form", ...base, error: "invalidEmail" };
  }

  if (intent === "signup") {
    if (!name) return { step: "form", ...base, error: "nameRequired" };
    if (password.length < PASSWORD_MIN) {
      return { step: "form", ...base, error: "passwordShort" };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: await callbackUrl(next),
        // Becomes profiles.display_name (handle_new_user trigger).
        data: { full_name: name },
      },
    });
    if (error) return { step: "form", ...base, error: authError(error) };
    // Supabase answers an already-registered email with a user that has no
    // identities (and sends nothing), so we can say so here.
    if (data.user && data.user.identities?.length === 0) {
      return { step: "form", ...base, error: "emailTaken" };
    }
    // Email confirmation switched off in Supabase: already signed in.
    if (data.session)
      redirect(await pathAfterSignIn(data.user!.id, next, locale));
    return { step: "code", email, name, purpose: "signup", sentAt: Date.now() };
  }

  if (intent === "password") {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error?.code === "email_not_confirmed") {
      const resendError = await sendCode("signup", email, next);
      if (resendError) {
        return { step: "form", ...base, error: authError(resendError) };
      }
      return {
        step: "code",
        email,
        name,
        purpose: "signup",
        sentAt: Date.now(),
      };
    }
    if (error || !data.user) {
      return {
        step: "form",
        ...base,
        error: error ? authError(error) : "generic",
      };
    }
    redirect(await pathAfterSignIn(data.user.id, next, locale));
  }

  const codePurpose = intent === "forgot" ? "recovery" : "login";
  const error = await sendCode(codePurpose, email, next);
  if (error) return { step: "form", ...base, error: authError(error) };
  return {
    step: "code",
    email,
    name,
    purpose: codePurpose,
    sentAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Set or change the password (after "forgot password", or from My account)
// ---------------------------------------------------------------------------

export type PasswordState = {
  error?: "passwordShort" | "passwordMismatch" | "samePassword" | "generic";
};

export async function setPasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const locale = await getLocale();
  if (!(await getCurrentUser())) {
    redirect(getPathname({ href: "/login", locale }));
  }

  const password = String(formData.get("password") ?? "");
  if (password.length < PASSWORD_MIN) return { error: "passwordShort" };
  if (password !== formData.get("confirm"))
    return { error: "passwordMismatch" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error?.code === "same_password") return { error: "samePassword" };
  if (error?.code === "weak_password") return { error: "passwordShort" };
  if (error) return { error: "generic" };

  redirect(
    safeNextPath(formData.get("next")) ??
      getPathname({
        href: { pathname: "/akaun", query: { password: "saved" } },
        locale,
      }),
  );
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
