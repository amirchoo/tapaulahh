import { ChevronLeft, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PanelBody, PanelHeader } from "@/components/layout/panel";
import { formatPrice } from "@/components/pasar/format";
import { SplitView } from "@/components/layout/split-view";
import { PasarSpotMapLazy } from "@/components/pasar/pasar-spot-map-lazy";
import { PhotoStrip } from "@/components/pasar/photo-strip";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { getPasarBySlug, getVendor } from "@/lib/pasar/queries";
import { WEEK } from "@/lib/pasar/schedule";
import { getReviews } from "@/lib/reviews/queries";
import type { VendorItem } from "@/lib/pasar/types";
import type { Locale } from "@/i18n/routing";

async function load(slug: string, vendorSlug: string) {
  const pasar = await getPasarBySlug(slug);
  const vendor = pasar && (await getVendor(pasar.id, vendorSlug));
  return pasar && vendor ? { pasar, vendor } : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/pasar/[slug]/[vendor]">): Promise<Metadata> {
  const locale = await initLocale(params);
  const { slug, vendor: vendorSlug } = await params;
  const found = await load(slug, vendorSlug);
  if (!found) return {};
  const { pasar, vendor } = found;
  const t = await getTranslations({ locale, namespace: "Vendor" });
  return {
    title: `${vendor.name} · ${pasar.name}`,
    description:
      vendor.description ??
      t("metaDescription", { name: vendor.name, pasar: pasar.name }),
    openGraph: vendor.photos[0] ? { images: [vendor.photos[0]] } : undefined,
  };
}

export default async function VendorPage({
  params,
}: PageProps<"/[locale]/pasar/[slug]/[vendor]">) {
  const locale = await initLocale(params);
  const { slug, vendor: vendorSlug } = await params;
  const found = await load(slug, vendorSlug);
  if (!found) notFound();
  const { pasar, vendor } = found;
  const reviews = await getReviews("vendor", vendor.id);
  const t = await getTranslations("Vendor");
  const tDays = await getTranslations("Days");
  const category = vendor.category
    ? locale === "en"
      ? vendor.category.nameEn
      : vendor.category.nameMs
    : t("eyebrow");
  const days = WEEK.filter((d) => vendor.usualDays.includes(d));

  return (
    <SplitView
      main={<PasarSpotMapLazy location={pasar.location} label={pasar.name} />}
      panel={
        <>
          <div className="px-2 pt-2 lg:px-4 lg:pt-4">
            <Link
              href={{ pathname: "/pasar/[slug]", params: { slug } }}
              className="inline-flex h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ChevronLeft className="size-4" aria-hidden />
              {pasar.name}
            </Link>
          </div>
          <PanelHeader
            eyebrow={category}
            title={vendor.name}
            subtitle={vendor.priceRange ?? undefined}
          />
          <PanelBody>
            <div className="space-y-6">
              {reviews.count > 0 && (
                <div className="-mt-2">
                  <RatingSummary summary={reviews} />
                </div>
              )}
              <PhotoStrip photos={vendor.photos} alt={vendor.name} />
              {vendor.description && (
                <section className="space-y-1">
                  <h2 className="font-extrabold">{t("whatTheySell")}</h2>
                  <p className="text-sm whitespace-pre-line">
                    {vendor.description}
                  </p>
                </section>
              )}
              {vendor.items.length > 0 && (
                <Menu items={vendor.items} locale={locale} />
              )}
              {days.length > 0 && (
                <section className="space-y-2">
                  <h2 className="font-extrabold">{t("usualDays")}</h2>
                  <ul className="flex flex-wrap gap-2">
                    {days.map((d) => (
                      <li
                        key={d}
                        className="rounded-lg bg-pasar/15 px-3 py-1.5 text-sm font-semibold"
                      >
                        {tDays(`long.${d}`)}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    {t("daysNote")}
                  </p>
                </section>
              )}
              <ReviewsSection
                targetType="vendor"
                targetId={vendor.id}
                summary={reviews}
              />
            </div>
          </PanelBody>
        </>
      }
    />
  );
}

async function Menu({
  items,
  locale,
}: {
  items: VendorItem[];
  locale: Locale;
}) {
  const t = await getTranslations("Vendor");
  return (
    <section className="space-y-2">
      <h2 className="font-extrabold">{t("menu")}</h2>
      <ul className="divide-y rounded-xl border">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn("flex gap-3 p-3", !item.isAvailable && "opacity-60")}
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{item.name}</p>
              {item.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
              <p className="mt-1 text-sm font-bold">
                {item.priceRm != null && (
                  <span className="text-pasar-text">
                    {formatPrice(item.priceRm, locale)}
                  </span>
                )}
                {!item.isAvailable && (
                  <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {t("soldOut")}
                  </span>
                )}
              </p>
            </div>
            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {item.photoUrl ? (
                <Image
                  src={item.photoUrl}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <UtensilsCrossed
                  className="size-6 text-muted-foreground"
                  aria-hidden
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
