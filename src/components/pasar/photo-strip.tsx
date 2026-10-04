import Image from "next/image";

/** Swipeable row of photos; the first one is the cover. */
export function PhotoStrip({ photos, alt }: { photos: string[]; alt: string }) {
  if (photos.length === 0) return null;
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 lg:-mx-6 lg:px-6">
      {photos.map((url, i) => (
        <li
          key={url}
          className="relative aspect-4/3 w-64 shrink-0 snap-start overflow-hidden bg-muted"
        >
          <Image
            src={url}
            alt={i === 0 ? alt : ""}
            fill
            sizes="256px"
            className="object-cover"
            priority={i === 0}
          />
        </li>
      ))}
    </ul>
  );
}
