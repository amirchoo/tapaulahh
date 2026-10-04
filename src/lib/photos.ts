import { SUPABASE_URL } from "@/lib/supabase/env";

/** Admin-managed photos for pasars and their stalls (VISION §7). */
export const PASAR_PHOTOS_BUCKET = "pasar-photos";
export const MAX_PHOTOS = 8;

const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${PASAR_PHOTOS_BUCKET}/`;

/** Folder for one pasar's or stall's photos, e.g. "pasars/<id>". */
export function photoFolder(kind: "pasars" | "vendors", id: string): string {
  return `${kind}/${id}`;
}

/** Folder for one menu item's photo, inside its stall's folder. */
export function itemPhotoFolder(vendorId: string, itemId: string): string {
  return `${photoFolder("vendors", vendorId)}/items/${itemId}`;
}

/** Public URL → path inside the bucket, or null if it isn't one of ours. */
export function photoPath(url: string, folder?: string): string | null {
  if (!url.startsWith(PUBLIC_PREFIX)) return null;
  const path = url.slice(PUBLIC_PREFIX.length);
  if (path.includes("..") || (folder && !path.startsWith(`${folder}/`))) {
    return null;
  }
  return path;
}
