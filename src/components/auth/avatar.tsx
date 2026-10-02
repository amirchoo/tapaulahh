import { cn } from "@/lib/utils";

/** Profile photo (from Google) or the first letter of the name. */
export function Avatar({
  name,
  url,
  className,
}: {
  name: string;
  url?: string | null;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-pasar font-extrabold text-on-pasar",
        className,
      )}
    >
      {url ? (
        // Google avatars: tiny, external, and not worth next/image config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
}
