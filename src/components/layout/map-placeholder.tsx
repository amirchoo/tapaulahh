import { MapPinned } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Stand-in for the MapLibre map (Part 3).
export function MapPlaceholder({
  section = "pasar",
  note,
}: {
  section?: "pasar" | "kedai";
  note?: string;
}) {
  const t = useTranslations("Common");

  return (
    <div className="relative flex h-full items-start justify-center bg-background bg-[radial-gradient(var(--border)_1.5px,transparent_1.5px)] bg-size-[22px_22px] pt-[18%] lg:items-center lg:pt-0">
      <div className="flex flex-col items-center gap-2 border bg-card px-5 py-4 text-center">
        <MapPinned
          className={cn(
            "size-7",
            section === "pasar" ? "text-pasar-text" : "text-kedai",
          )}
          aria-hidden
        />
        <p className="text-sm font-semibold">{t("mapPlaceholder")}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}
