import { Package, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { formatPrice } from "./format";

export type ListItem = {
  id: string;
  name: string;
  description: string | null;
  priceRm: number | null;
  photoUrl: string | null;
  isAvailable: boolean;
};

/** What a stall or shop sells: name, blurb, price, photo; sold-out items dimmed. */
export function MenuList({
  title,
  items,
  locale,
  soldOutLabel,
  section = "pasar",
}: {
  title: string;
  items: ListItem[];
  locale: Locale;
  soldOutLabel: string;
  /** Price colour and placeholder icon: pasar stalls vs Peniaga Kecil. */
  section?: "pasar" | "kedai";
}) {
  const Icon = section === "pasar" ? UtensilsCrossed : Package;
  return (
    <section className="space-y-2">
      <h2 className="font-extrabold">{title}</h2>
      <ul className="divide-y border">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn("flex gap-3 p-3", !item.isAvailable && "opacity-60")}
          >
            <div className="min-w-0 flex-1 break-words">
              <p className="font-semibold">{item.name}</p>
              {item.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
              <p className="mt-1 text-sm font-bold">
                {item.priceRm != null && (
                  <span
                    className={
                      section === "pasar" ? "text-pasar-text" : "text-kedai"
                    }
                  >
                    {formatPrice(item.priceRm, locale)}
                  </span>
                )}
                {!item.isAvailable && (
                  <span className="ml-2 bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {soldOutLabel}
                  </span>
                )}
              </p>
            </div>
            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden bg-muted">
              {item.photoUrl ? (
                <Image
                  src={item.photoUrl}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <Icon className="size-6 text-muted-foreground" aria-hidden />
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
