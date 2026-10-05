"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import type { AdminFormState, FieldError } from "@/lib/admin/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { readLocation } from "@/lib/geo/resolve";
import { MALAYSIAN_STATES } from "@/lib/pasar/states";
import { BUSINESS_PHOTOS_BUCKET, photoPath } from "@/lib/photos";
import { removePhotos } from "@/lib/photos-server";
import { slugify } from "@/lib/slug";
import { PUBLIC_DATA_TAG } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { normalizeInstagram, normalizeWhatsapp } from "./contact";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, name: string, max = 2000): string {
  return String(formData.get(name) ?? "")
    .trim()
    .slice(0, max);
}

const orNull = (value: string) => value || null;

/** The signed-in user's business with this id, or null (not theirs / gone). */
async function ownBusiness(userId: string, id: string) {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("home_businesses")
    .select("id, status, logo_url")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();
  return data;
}

/** "RM 3.50", "3,50", "12" → 3.5 / 12. Empty → null. */
function parsePrice(input: string): number | null | "invalid" {
  const cleaned = input
    .replace(/^rm\s*/i, "")
    .replace(",", ".")
    .trim();
  if (!cleaned) return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(cleaned)) return "invalid";
  return Number(cleaned);
}

async function myBusinessPath() {
  return getPathname({ href: "/akaun/kedai", locale: await getLocale() });
}

// ---------------------------------------------------------------------------
// Register / edit the business
// ---------------------------------------------------------------------------

/**
 * Registers a new business (it starts pending; an admin approves it) or saves
 * changes. A rejected business is sent back for review when saved.
 */
export async function saveBusinessAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const user = await getCurrentUser();
  if (!user) redirect(await myBusinessPath());

  const id = text(formData, "id");
  const isNew = formData.get("isNew") === "1";
  if (!UUID_RE.test(id)) return { error: "generic" };
  const existing = isNew ? null : await ownBusiness(user.id, id);
  if (!isNew && !existing) return { error: "forbidden" };

  const fieldErrors: Record<string, FieldError> = {};
  const name = text(formData, "name", 120);
  if (!name) fieldErrors.name = "required";
  const district = text(formData, "district", 80);
  if (!district) fieldErrors.district = "required";
  const state = text(formData, "state");
  if (!MALAYSIAN_STATES.some((s) => s === state)) fieldErrors.state = "invalid";
  const categoryId = text(formData, "category_id");
  if (!UUID_RE.test(categoryId)) fieldErrors.category_id = "required";

  const whatsapp = normalizeWhatsapp(text(formData, "whatsapp", 40));
  if (whatsapp === "invalid") fieldErrors.whatsapp = "phoneInvalid";
  const instagram = normalizeInstagram(text(formData, "instagram", 120));
  if (instagram === "invalid") fieldErrors.instagram = "instagramInvalid";
  if (whatsapp === null && instagram === null) {
    fieldErrors.whatsapp = "contactRequired";
  }

  // Exact spot: optional, private. Only a fuzzed area is ever shown.
  const locationInput = text(formData, "location");
  let location: { lat: number; lng: number } | null = null;
  if (locationInput) {
    const result = await readLocation(locationInput);
    if (typeof result === "string") fieldErrors.location = result;
    else location = result;
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    whatsapp === "invalid" ||
    instagram === "invalid"
  ) {
    return { fieldErrors };
  }

  const logo =
    formData
      .getAll("logo")
      .map(String)
      .find((url) => photoPath(url, user.id, BUSINESS_PHOTOS_BUCKET)) ?? null;

  const row = {
    name,
    category_id: categoryId,
    description: orNull(text(formData, "description")),
    district,
    state,
    whatsapp,
    instagram,
    hours: orNull(text(formData, "hours", 300)),
    delivery_notes: orNull(text(formData, "delivery_notes", 500)),
    logo_url: logo,
  };

  const supabase = await createClient();
  let error: PostgrestError | null = null;
  if (isNew) {
    // One business per account for now.
    const { count } = await supabase
      .from("home_businesses")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id);
    if (count) return { error: "generic" };

    // The slug comes from the name; add -2, -3… if it's taken. It doesn't
    // change on later renames, so shared links keep working.
    const base = slugify(name) || "kedai";
    for (let n = 1; n <= 20; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      ({ error } = await supabase
        .from("home_businesses")
        .insert({ id, slug, ...row }));
      if (error?.code !== "23505") break;
    }
  } else {
    ({ error } = await supabase
      .from("home_businesses")
      .update(
        // Saving a rejected business sends it back for review.
        existing?.status === "rejected" ? { ...row, status: "pending" } : row,
      )
      .eq("id", id));
  }
  if (error) {
    console.error("Saving business failed:", error.message);
    return { error: "generic" };
  }

  if (location) {
    const { error: locError } = await supabase
      .from("home_business_locations")
      .upsert({
        business_id: id,
        address: orNull(text(formData, "address", 300)),
        location: `SRID=4326;POINT(${location.lng} ${location.lat})`,
      });
    if (locError) console.error("Saving location failed:", locError.message);
  } else {
    await supabase
      .from("home_business_locations")
      .delete()
      .eq("business_id", id);
  }

  if (existing?.logo_url) {
    await removePhotos(
      [existing.logo_url],
      logo ? [logo] : [],
      BUSINESS_PHOTOS_BUCKET,
    );
  }
  updateTag(PUBLIC_DATA_TAG);
  refresh();
  return { saved: true };
}

export async function deleteBusinessAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = text(formData, "id");
  if (!(await ownBusiness(user.id, id))) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("home_businesses")
    .select("logo_url, catalog_items (photo_url)")
    .eq("id", id)
    .single();
  // Location, catalog and reviews go with it.
  const { error } = await supabase
    .from("home_businesses")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Deleting business failed:", error.message);
    return;
  }
  await removePhotos(
    [
      ...(data?.logo_url ? [data.logo_url] : []),
      ...(data?.catalog_items ?? []).flatMap((i) => i.photo_url ?? []),
    ],
    [],
    BUSINESS_PHOTOS_BUCKET,
  );
  updateTag(PUBLIC_DATA_TAG);
  redirect(getPathname({ href: "/akaun", locale: await getLocale() }));
}

// ---------------------------------------------------------------------------
// Catalog (same form as a stall's menu; "parentId" is the business id)
// ---------------------------------------------------------------------------

export async function saveCatalogItemAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "forbidden" };
  const id = text(formData, "id");
  const businessId = text(formData, "parentId");
  const isNew = formData.get("isNew") === "1";
  if (!UUID_RE.test(id) || !(await ownBusiness(user.id, businessId))) {
    return { error: "forbidden" };
  }

  const name = text(formData, "name", 120);
  const price = parsePrice(text(formData, "price", 20));
  const fieldErrors: Record<string, FieldError> = {};
  if (!name) fieldErrors.name = "required";
  if (price === "invalid") fieldErrors.price = "priceInvalid";
  if (Object.keys(fieldErrors).length > 0 || price === "invalid") {
    return { fieldErrors };
  }

  const photo =
    formData
      .getAll("photo")
      .map(String)
      .find((url) =>
        photoPath(url, `${user.id}/items/${id}`, BUSINESS_PHOTOS_BUCKET),
      ) ?? null;
  const row = {
    name,
    description: orNull(text(formData, "description", 500)),
    price_rm: price,
    photo_url: photo,
    is_available: formData.get("is_available") !== "0",
  };

  const supabase = await createClient();
  let oldPhoto: string | null = null;
  let error: PostgrestError | null;
  if (isNew) {
    const { data: last } = await supabase
      .from("catalog_items")
      .select("sort_order")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await supabase.from("catalog_items").insert({
      id,
      business_id: businessId,
      sort_order: (last?.sort_order ?? 0) + 1,
      ...row,
    }));
  } else {
    const { data: before } = await supabase
      .from("catalog_items")
      .select("photo_url")
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();
    if (!before) return { error: "generic" };
    oldPhoto = before.photo_url;
    ({ error } = await supabase
      .from("catalog_items")
      .update(row)
      .eq("id", id)
      .eq("business_id", businessId));
  }
  if (error) {
    console.error("Saving catalog item failed:", error.message);
    return { error: "generic" };
  }
  if (oldPhoto) {
    await removePhotos(
      [oldPhoto],
      photo ? [photo] : [],
      BUSINESS_PHOTOS_BUCKET,
    );
  }
  updateTag(PUBLIC_DATA_TAG);
  refresh();
  return { saved: true };
}

export async function deleteCatalogItemAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = text(formData, "id");
  const businessId = text(formData, "parentId");
  if (!user || !UUID_RE.test(id) || !(await ownBusiness(user.id, businessId))) {
    return;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_items")
    .delete()
    .eq("id", id)
    .eq("business_id", businessId)
    .select("photo_url")
    .maybeSingle();
  if (data?.photo_url) {
    await removePhotos([data.photo_url], [], BUSINESS_PHOTOS_BUCKET);
  }
  updateTag(PUBLIC_DATA_TAG);
  refresh();
}

/** Moves a catalog item one place up or down. */
export async function moveCatalogItemAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = text(formData, "id");
  const businessId = text(formData, "parentId");
  const step = formData.get("direction") === "up" ? -1 : 1;
  if (!user || !(await ownBusiness(user.id, businessId))) return;

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("catalog_items")
    .select("id")
    .eq("business_id", businessId)
    .order("sort_order")
    .order("created_at");
  if (!items) return;
  const ids = items.map((i) => i.id);
  const from = ids.indexOf(id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await Promise.all(
    ids.map((itemId, i) =>
      supabase
        .from("catalog_items")
        .update({ sort_order: i + 1 })
        .eq("id", itemId)
        .eq("business_id", businessId),
    ),
  );
  updateTag(PUBLIC_DATA_TAG);
  refresh();
}
