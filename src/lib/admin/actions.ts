"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { getAdminUser } from "@/lib/auth/session";
import { isInMalaysia, parseLocation } from "@/lib/geo/parse-location";
import { MALAYSIAN_STATES } from "@/lib/pasar/states";
import type { LatLng } from "@/lib/pasar/types";
import {
  MAX_PHOTOS,
  PASAR_PHOTOS_BUCKET,
  photoFolder,
  photoPath,
} from "@/lib/photos";
import { SLUG_RE, slugify } from "@/lib/slug";
import { PUBLIC_DATA_TAG } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

export type FieldError =
  | "required"
  | "invalid"
  | "taken"
  | "locationUnreadable"
  | "locationOutside"
  | "scheduleRequired"
  | "timeInvalid";

export type AdminFormState = {
  error?: "forbidden" | "generic";
  fieldErrors?: Record<string, FieldError>;
  saved?: boolean;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = [0, 1, 2, 3, 4, 5, 6];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function text(formData: FormData, name: string, max = 2000): string {
  return String(formData.get(name) ?? "")
    .trim()
    .slice(0, max);
}

/** Empty optional fields are stored as null, not "". */
const orNull = (value: string) => value || null;

const isUniqueViolation = (error: PostgrestError | null) =>
  error?.code === "23505";

/** Photo URLs from the form, keeping only ones in this item's own folder. */
function photosFrom(formData: FormData, folder: string): string[] {
  return formData
    .getAll("photos")
    .map(String)
    .filter((url) => photoPath(url, folder))
    .slice(0, MAX_PHOTOS);
}

/** Deletes files that were in `before` but not in `after`. */
async function removePhotos(before: string[], after: string[] = []) {
  const paths = before
    .filter((url) => !after.includes(url))
    .flatMap((url) => photoPath(url) ?? []);
  if (paths.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(PASAR_PHOTOS_BUCKET)
    .remove(paths);
  if (error) console.error("Photo cleanup failed:", error.message);
}

const GOOGLE_HOSTS =
  /^(maps\.app\.goo\.gl|goo\.gl|g\.co|(www\.|maps\.)?google\.com(\.my)?)$/;

/** maps.app.goo.gl/… → the full google.com/maps link it points to. */
async function expandMapsLink(input: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return input; // plain "lat, lng"
  }
  for (let hop = 0; hop < 5; hop++) {
    if (url.protocol !== "https:" || !GOOGLE_HOSTS.test(url.hostname)) break;
    if (/[!@]|[?&](q|query|ll)=-?\d/.test(url.href)) break;
    const res = await fetch(url, { redirect: "manual", cache: "no-store" });
    const next = res.headers.get("location");
    if (!next) break;
    url = new URL(next, url);
  }
  return url.href;
}

async function readLocation(
  input: string,
): Promise<LatLng | "locationUnreadable" | "locationOutside"> {
  const location = parseLocation(await expandMapsLink(input));
  if (!location) return "locationUnreadable";
  if (!isInMalaysia(location)) return "locationOutside";
  return location;
}

/**
 * Inserts or updates with a slug. When the admin left the slug empty, a taken
 * slug gets "-2", "-3"… instead of failing.
 */
async function writeWithSlug(
  slug: string,
  auto: boolean,
  write: (slug: string) => PromiseLike<{ error: PostgrestError | null }>,
): Promise<{ error: PostgrestError | null; slugTaken: boolean }> {
  for (let n = 1; n <= (auto ? 20 : 1); n++) {
    const candidate = n === 1 ? slug : `${slug}-${n}`;
    const { error } = await write(candidate);
    if (!isUniqueViolation(error)) return { error, slugTaken: false };
  }
  return { error: null, slugTaken: true };
}

async function adminPath(
  href: Parameters<typeof getPathname>[0]["href"],
): Promise<string> {
  return getPathname({ href, locale: await getLocale() });
}

// ---------------------------------------------------------------------------
// Pasar
// ---------------------------------------------------------------------------

export async function savePasarAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  if (!(await getAdminUser())) return { error: "forbidden" };

  const id = text(formData, "id");
  const isNew = formData.get("isNew") === "1";
  if (!UUID_RE.test(id)) return { error: "generic" };

  const fieldErrors: Record<string, FieldError> = {};
  const name = text(formData, "name", 120);
  if (!name) fieldErrors.name = "required";

  const slugInput = text(formData, "slug", 80).toLowerCase();
  const slug = slugInput || slugify(name);
  if (name && !SLUG_RE.test(slug)) fieldErrors.slug = "invalid";

  const district = text(formData, "district", 80);
  if (!district) fieldErrors.district = "required";

  const state = text(formData, "state");
  if (!MALAYSIAN_STATES.some((s) => s === state)) fieldErrors.state = "invalid";

  const status = formData.get("status") === "inactive" ? "inactive" : "active";

  const schedules = DAYS.flatMap((day) => {
    if (!formData.get(`day_${day}`)) return [];
    const start = text(formData, `start_${day}`);
    const end = text(formData, `end_${day}`);
    if (!TIME_RE.test(start) || !TIME_RE.test(end) || start === end) {
      fieldErrors.schedule = "timeInvalid";
    }
    return [{ day_of_week: day, start_time: start, end_time: end }];
  });
  if (schedules.length === 0) fieldErrors.schedule = "scheduleRequired";

  const locationInput = text(formData, "location");
  let location: LatLng | null = null;
  if (!locationInput) {
    fieldErrors.location = "required";
  } else {
    const result = await readLocation(locationInput);
    if (typeof result === "string") fieldErrors.location = result;
    else location = result;
  }

  if (Object.keys(fieldErrors).length > 0 || !location) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const folder = photoFolder("pasars", id);
  const photos = photosFrom(formData, folder);

  let oldPhotos: string[] = [];
  if (!isNew) {
    const { data } = await supabase
      .from("pasars")
      .select("photos")
      .eq("id", id)
      .maybeSingle();
    if (!data) return { error: "generic" };
    oldPhotos = data.photos;
  }

  const row = {
    name,
    description: orNull(text(formData, "description")),
    // EWKT: PostGIS takes longitude first.
    location: `SRID=4326;POINT(${location.lng} ${location.lat})`,
    address: orNull(text(formData, "address", 300)),
    district,
    state,
    parking_notes: orNull(text(formData, "parking_notes")),
    photos,
    status,
  } as const;

  const { error, slugTaken } = await writeWithSlug(slug, !slugInput, (s) =>
    isNew
      ? supabase.from("pasars").insert({ id, slug: s, ...row })
      : supabase
          .from("pasars")
          .update({ slug: s, ...row })
          .eq("id", id),
  );
  if (slugTaken) return { fieldErrors: { slug: "taken" } };
  if (error) {
    console.error("Saving pasar failed:", error.message);
    return { error: "generic" };
  }

  const { error: scheduleError } = await supabase.rpc("set_pasar_schedules", {
    p_pasar_id: id,
    p_schedules: schedules,
  });
  if (scheduleError) {
    console.error("Saving schedule failed:", scheduleError.message);
    return { error: "generic" };
  }

  await removePhotos(oldPhotos, photos);
  updateTag(PUBLIC_DATA_TAG);

  if (isNew) {
    redirect(
      await adminPath({ pathname: "/admin/pasar/[id]", params: { id } }),
    );
  }
  refresh();
  return { saved: true };
}

export async function deletePasarAction(formData: FormData) {
  if (!(await getAdminUser())) return;
  const id = text(formData, "id");
  if (!UUID_RE.test(id)) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("pasars")
    .select("photos, vendors (photos)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return;

  // Stalls and schedules go with it (on delete cascade).
  const { error } = await supabase.from("pasars").delete().eq("id", id);
  if (error) {
    console.error("Deleting pasar failed:", error.message);
    return;
  }
  await removePhotos([
    ...data.photos,
    ...data.vendors.flatMap((v) => v.photos),
  ]);
  updateTag(PUBLIC_DATA_TAG);
  redirect(await adminPath("/admin"));
}

// ---------------------------------------------------------------------------
// Vendors (stalls)
// ---------------------------------------------------------------------------

const VENDOR_STATUSES = ["active", "pending", "inactive"] as const;

export async function saveVendorAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  if (!(await getAdminUser())) return { error: "forbidden" };

  const id = text(formData, "id");
  const pasarId = text(formData, "pasarId");
  const isNew = formData.get("isNew") === "1";
  if (!UUID_RE.test(id) || !UUID_RE.test(pasarId)) return { error: "generic" };

  const fieldErrors: Record<string, FieldError> = {};
  const name = text(formData, "name", 120);
  if (!name) fieldErrors.name = "required";

  const slugInput = text(formData, "slug", 80).toLowerCase();
  const slug = slugInput || slugify(name);
  if (name && !SLUG_RE.test(slug)) fieldErrors.slug = "invalid";

  const categoryId = text(formData, "category_id");
  if (categoryId && !UUID_RE.test(categoryId)) {
    fieldErrors.category_id = "invalid";
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const status =
    VENDOR_STATUSES.find((s) => s === formData.get("status")) ?? "active";
  const usualDays = DAYS.filter((day) =>
    formData.getAll("usual_days").includes(String(day)),
  );

  const supabase = await createClient();
  const folder = photoFolder("vendors", id);
  const photos = photosFrom(formData, folder);

  let oldPhotos: string[] = [];
  if (!isNew) {
    const { data } = await supabase
      .from("vendors")
      .select("photos")
      .eq("id", id)
      .eq("pasar_id", pasarId)
      .maybeSingle();
    if (!data) return { error: "generic" };
    oldPhotos = data.photos;
  }

  const row = {
    name,
    category_id: orNull(categoryId),
    description: orNull(text(formData, "description")),
    price_range: orNull(text(formData, "price_range", 60)),
    usual_days: usualDays,
    photos,
    status,
  };

  const { error, slugTaken } = await writeWithSlug(slug, !slugInput, (s) =>
    isNew
      ? supabase
          .from("vendors")
          .insert({ id, pasar_id: pasarId, slug: s, ...row })
      : supabase
          .from("vendors")
          .update({ slug: s, ...row })
          .eq("id", id)
          .eq("pasar_id", pasarId),
  );
  if (slugTaken) return { fieldErrors: { slug: "taken" } };
  if (error) {
    console.error("Saving stall failed:", error.message);
    return { error: "generic" };
  }

  await removePhotos(oldPhotos, photos);
  updateTag(PUBLIC_DATA_TAG);
  redirect(
    await adminPath({
      pathname: "/admin/pasar/[id]",
      params: { id: pasarId },
    }),
  );
}

export async function deleteVendorAction(formData: FormData) {
  if (!(await getAdminUser())) return;
  const id = text(formData, "id");
  const pasarId = text(formData, "pasarId");
  if (!UUID_RE.test(id) || !UUID_RE.test(pasarId)) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .delete()
    .eq("id", id)
    .eq("pasar_id", pasarId)
    .select("photos")
    .maybeSingle();
  if (error) {
    console.error("Deleting stall failed:", error.message);
    return;
  }
  if (data) await removePhotos(data.photos);
  updateTag(PUBLIC_DATA_TAG);
  redirect(
    await adminPath({
      pathname: "/admin/pasar/[id]",
      params: { id: pasarId },
    }),
  );
}
