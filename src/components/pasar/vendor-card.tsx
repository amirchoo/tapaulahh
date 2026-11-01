import { ArrowUpRight, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Vendor } from "@/lib/pasar/types";

/** A stall as a card: cover photo, then name, price range and a short blurb. */
export async function VendorCard({
  vendor,
  pasarSlug,
}: {
  vendor: Vendor;
  pasarSlug: string;
}) {
  const t = await getTranslations("Vendor");
  return (
    <Link
      href={{
        pathname: "/pasar/[slug]/[vendor]",
        params: { slug: pasarSlug, vendor: vendor.slug },
      }}
      className="group flex h-full min-w-0 overflow-hidden border bg-card outline-none hover:border-pasar focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-square w-24 shrink-0 self-start bg-pasar/10">
        {vendor.coverPhoto ? (
          <Image
            src={vendor.coverPhoto}
            alt=""
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
        <h4 className="font-heading leading-snug font-bold">{vendor.name}</h4>
        {vendor.priceRange && (
          <p className="line-clamp-1 text-sm leading-snug font-semibold text-pasar-text">
            {vendor.priceRange}
          </p>
        )}
        {vendor.description && (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {vendor.description}
          </p>
        )}
        <span className="mt-auto inline-flex min-h-11 items-center gap-1 pt-2 text-sm font-semibold text-pasar-text">
          {t("viewDetails")}
          <ArrowUpRight className="size-4 shrink-0" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
