import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Vendor } from "@/lib/pasar/types";

/** A stall as a card: cover photo, then name, price range and a short blurb. */
export function VendorCard({
  vendor,
  pasarSlug,
}: {
  vendor: Vendor;
  pasarSlug: string;
}) {
  return (
    <Link
      href={{
        pathname: "/pasar/[slug]/[vendor]",
        params: { slug: pasarSlug, vendor: vendor.slug },
      }}
      className="group flex h-full min-w-0 flex-col overflow-hidden border bg-card outline-none hover:border-pasar focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-4/3 bg-pasar/10">
        {vendor.coverPhoto ? (
          <Image
            src={vendor.coverPhoto}
            alt=""
            fill
            sizes="(min-width: 1024px) 180px, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <UtensilsCrossed
            aria-hidden
            className="absolute inset-0 m-auto size-8 text-pasar-text/50"
          />
        )}
      </div>
      {/* min-w-0 + break-words keep long names and big phone text sizes
          inside the card instead of spilling past its edges. */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 pt-2.5 pb-3 break-words">
        <p className="line-clamp-2 font-heading leading-snug font-bold">
          {vendor.name}
        </p>
        {vendor.priceRange && (
          <p className="line-clamp-1 text-sm leading-snug font-semibold text-pasar-text">
            {vendor.priceRange}
          </p>
        )}
        {vendor.description && (
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
            {vendor.description}
          </p>
        )}
      </div>
    </Link>
  );
}
