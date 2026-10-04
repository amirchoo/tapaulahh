"use client";

import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { MAX_PHOTOS, PASAR_PHOTOS_BUCKET } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_SIDE = 1600;

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/** Shrinks phone photos (often 4–10 MB) to ~200–400 KB before upload. */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Older Safari can't encode WebP and quietly returns PNG; use JPEG then.
  const webp = await toBlob(canvas, "image/webp", 0.8);
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob(canvas, "image/jpeg", 0.82);
  if (!jpeg) throw new Error("Could not encode image");
  return jpeg;
}

/**
 * Uploads straight from the browser to Storage (admins only, by RLS) and
 * keeps the URLs in hidden "photos" inputs for the form. The first photo is
 * the cover. Files of removed photos are deleted when the form is saved.
 */
export function PhotoUploader({
  folder,
  initial,
  onBusyChange,
  max = MAX_PHOTOS,
  name = "photos",
}: {
  /** e.g. "pasars/<id>" */
  folder: string;
  initial: string[];
  onBusyChange: (busy: boolean) => void;
  /** 1 for a single photo (menu items): no cover badge, one hidden input. */
  max?: number;
  /** Form field name for the URLs. */
  name?: string;
}) {
  const t = useTranslations("Admin.photos");
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const [failed, setFailed] = useState(false);
  // Uploaded in this visit and not saved yet: safe to delete right away.
  const fresh = useRef(new Set<string>());

  // Lets the form disable "Save" until every upload has finished.
  useEffect(() => onBusyChange(uploading > 0), [uploading, onBusyChange]);

  async function upload(files: File[]) {
    const supabase = createClient();
    const storage = supabase.storage.from(PASAR_PHOTOS_BUCKET);
    const batch = files.slice(0, max - photos.length - uploading);
    setFailed(false);
    setUploading((n) => n + batch.length);

    await Promise.all(
      batch.map(async (file) => {
        try {
          const blob = await compress(file);
          const ext = blob.type === "image/webp" ? "webp" : "jpg";
          const path = `${folder}/${crypto.randomUUID()}.${ext}`;
          const { error } = await storage.upload(path, blob, {
            contentType: blob.type,
            cacheControl: "31536000",
          });
          if (error) throw error;
          const url = storage.getPublicUrl(path).data.publicUrl;
          fresh.current.add(url);
          setPhotos((list) => [...list, url]);
        } catch (error) {
          console.error("Photo upload failed:", error);
          setFailed(true);
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  }

  function remove(url: string) {
    setPhotos((list) => list.filter((p) => p !== url));
    if (fresh.current.delete(url)) {
      const path = url.split(`/${PASAR_PHOTOS_BUCKET}/`)[1];
      if (path) createClient().storage.from(PASAR_PHOTOS_BUCKET).remove([path]);
    }
  }

  function makeCover(url: string) {
    setPhotos((list) => [url, ...list.filter((p) => p !== url)]);
  }

  const full = photos.length + uploading >= max;

  return (
    <div className="space-y-2">
      {photos.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}
      <ul
        className={cn(
          "grid gap-2",
          max === 1 ? "w-32 grid-cols-1" : "grid-cols-3 sm:grid-cols-4",
        )}
      >
        {photos.map((url, i) => (
          <li
            key={url}
            className="relative aspect-square overflow-hidden rounded-xl border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-cover" />
            {max === 1 ? null : i === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-md bg-pasar px-1.5 py-0.5 text-[11px] font-bold text-on-pasar">
                {t("cover")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(url)}
                aria-label={t("makeCover")}
                title={t("makeCover")}
                className="absolute bottom-1 left-1 flex size-8 items-center justify-center rounded-full bg-card/90 text-foreground shadow"
              >
                <Star className="size-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(url)}
              aria-label={t("remove")}
              title={t("remove")}
              className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-card/90 text-foreground shadow"
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <li
            key={`uploading-${i}`}
            className="flex aspect-square items-center justify-center rounded-xl border bg-muted"
          >
            <Loader2
              className="size-6 animate-spin text-muted-foreground"
              aria-label={t("uploading")}
            />
          </li>
        ))}
        {!full && (
          <li>
            <label
              className={cn(
                "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-center text-xs font-semibold text-muted-foreground hover:bg-muted",
                "focus-within:ring-3 focus-within:ring-ring/50",
              )}
            >
              <ImagePlus className="size-6" aria-hidden />
              {t("add")}
              <input
                type="file"
                accept="image/*"
                multiple={max > 1}
                className="sr-only"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  if (files.length) upload(files);
                }}
              />
            </label>
          </li>
        )}
      </ul>
      {max > 1 && (
        <p className="text-xs text-muted-foreground">{t("hint", { max })}</p>
      )}
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {t("failed")}
        </p>
      )}
    </div>
  );
}
