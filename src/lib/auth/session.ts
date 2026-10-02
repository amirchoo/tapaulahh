import "server-only";
import type { User } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getPathname, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

type Href = Parameters<typeof getPathname>[0]["href"];

export type Profile = {
  displayName: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  createdAt: string;
};

/** The signed-in user for this request, or null. Checked with Supabase Auth. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export const getProfile = cache(
  async (userId: string): Promise<Profile | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, role, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (!data) return null;
    return {
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      role: data.role,
      createdAt: data.created_at,
    };
  },
);

/**
 * Like Bolahh's PrivateRoute: returns the user, or sends them to /login and
 * back to `here` afterwards.
 */
export async function requireUser(locale: Locale, here: Href): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    return redirect({
      href: {
        pathname: "/login",
        query: { next: getPathname({ href: here, locale }) },
      },
      locale,
    });
  }
  return user;
}

/**
 * Like Bolahh's AdminRoute: signed-out visitors go to /login, signed-in
 * non-admins get a 404 (so the admin area doesn't advertise itself).
 */
export async function requireAdmin(locale: Locale, here: Href): Promise<User> {
  const user = await requireUser(locale, here);
  if ((await getProfile(user.id))?.role !== "admin") notFound();
  return user;
}

/** For server actions: the admin making the request, or null. */
export async function getAdminUser(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return (await getProfile(user.id))?.role === "admin" ? user : null;
}

/**
 * Where to go right after signing in: the welcome step if they have no name
 * yet, otherwise `next` (a localized path).
 */
export async function pathAfterSignIn(
  userId: string,
  next: string,
  locale: Locale,
): Promise<string> {
  const profile = await getProfile(userId);
  if (profile?.displayName) return next;
  return getPathname({
    href: { pathname: "/akaun/selamat-datang", query: { next } },
    locale,
  });
}
