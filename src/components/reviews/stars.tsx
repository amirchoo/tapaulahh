import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only stars; `label` is what screen readers hear ("4.5 out of 5"). */
export function Stars({
  rating,
  label,
  className,
}: {
  rating: number;
  label: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn(
            "size-4",
            // Half a star or more rounds up to a full one.
            n <= Math.round(rating)
              ? "fill-pasar text-pasar"
              : "fill-transparent text-border",
          )}
        />
      ))}
    </span>
  );
}
