import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PASAR_PHOTOS_BUCKET, photoPath, type PhotoBucket } from "./photos";

/** Deletes files that were in `before` but not in `after`. */
export async function removePhotos(
  before: string[],
  after: string[] = [],
  bucket: PhotoBucket = PASAR_PHOTOS_BUCKET,
) {
  const paths = before
    .filter((url) => !after.includes(url))
    .flatMap((url) => photoPath(url, undefined, bucket) ?? []);
  if (paths.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) console.error("Photo cleanup failed:", error.message);
}
