import { SUPABASE_URL } from "@/lib/supabase/env";

/** Admin-managed photos for pasars and their stalls (VISION §7). */
export const PASAR_PHOTOS_BUCKET = "pasar-photos";
/** Peniaga Kecil photos; each owner may only write in a folder named after their user id. */
export const BUSINESS_PHOTOS_BUCKET = "business-photos";
export type PhotoBucket =
  typeof PASAR_PHOTOS_BUCKET | typeof BUSINESS_PHOTOS_BUCKET;
export const MAX_PHOTOS = 8;

const publicPrefix = (bucket: PhotoBucket) =>
  `${SUPABASE_URL}/storage/v1/object/public/${bucket}/`;

/** Folder for one pasar's or stall's photos, e.g. "pasars/<id>". */
export function photoFolder(kind: "pasars" | "vendors", id: string): string {
  return `${kind}/${id}`;
}

/** Folder for one menu item's photo, inside its stall's folder. */
export function itemPhotoFolder(vendorId: string, itemId: string): string {
  return `${photoFolder("vendors", vendorId)}/items/${itemId}`;
}

/** Public URL → path inside the bucket, or null if it isn't one of ours. */
export function photoPath(
  url: string,
  folder?: string,
  bucket: PhotoBucket = PASAR_PHOTOS_BUCKET,
): string | null {
  const prefix = publicPrefix(bucket);
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  if (path.includes("..") || (folder && !path.startsWith(`${folder}/`))) {
    return null;
  }
  return path;
}
