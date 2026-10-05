import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PanelBody, PanelHeader } from "@/components/layout/panel";
import { SplitView } from "@/components/layout/split-view";
import { PasarSpotMapLazy } from "@/components/pasar/pasar-spot-map-lazy";
import { MenuList } from "@/components/pasar/menu-list";
import { PhotoStrip } from "@/components/pasar/photo-strip";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { getPasarBySlug, getVendor } from "@/lib/pasar/queries";
import { WEEK } from "@/lib/pasar/schedule";
import { getReviews } from "@/lib/reviews/queries";

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
              className="inline-flex h-11 items-center gap-1 px-2 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
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
                <MenuList
                  title={t("menu")}
                  items={vendor.items}
                  locale={locale}
                  soldOutLabel={t("soldOut")}
                />
              )}
              {days.length > 0 && (
                <section className="space-y-2">
                  <h2 className="font-extrabold">{t("usualDays")}</h2>
                  <ul className="flex flex-wrap gap-2">
                    {days.map((d) => (
                      <li
                        key={d}
                        className="bg-pasar/15 px-3 py-1.5 text-sm font-semibold"
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
