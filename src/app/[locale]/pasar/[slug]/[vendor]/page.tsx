import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PasarLocationDialog } from "@/components/pasar/pasar-location-dialog";
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
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-12 lg:px-6 lg:pt-6">
      <div className="mb-4">
        <Link
          href={{ pathname: "/pasar/[slug]", params: { slug } }}
          className="inline-flex min-h-11 items-center gap-1 py-2 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">{pasar.name}</span>
        </Link>
      </div>
      <header className="space-y-3">
        <p className="text-sm font-bold text-pasar-text">{category}</p>
        <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight break-words lg:text-4xl">
          {vendor.name}
        </h1>
        {vendor.priceRange && (
          <p className="font-semibold text-pasar-text">{vendor.priceRange}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <RatingSummary summary={reviews} />
        </div>
      </header>
      <nav
        aria-label={t("pageSections")}
        className="mt-6 mb-6 flex flex-wrap gap-x-6 border-b"
      >
        {vendor.items.length > 0 && (
          <a
            href="#menu"
            className="inline-flex min-h-11 items-center text-sm font-semibold outline-none hover:text-pasar-text focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t("menu")}
          </a>
        )}
        <a
          href="#ulasan"
          className="inline-flex min-h-11 items-center text-sm font-semibold outline-none hover:text-pasar-text focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t("reviewsTitle")}
        </a>
      </nav>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          {vendor.description && (
            <section className="space-y-1">
              <h2 className="font-extrabold">{t("whatTheySell")}</h2>
              <p className="text-sm whitespace-pre-line">
                {vendor.description}
              </p>
            </section>
          )}
          {vendor.items.length > 0 && (
            <div id="menu" className="scroll-mt-4">
              <MenuList
                title={t("menu")}
                items={vendor.items}
                locale={locale}
                soldOutLabel={t("soldOut")}
              />
            </div>
          )}
          <PhotoStrip photos={vendor.photos} alt={vendor.name} />
          <div className="border-t pt-6">
            <ReviewsSection
              targetType="vendor"
              targetId={vendor.id}
              summary={reviews}
              heading={t("reviewsTitle")}
              description={t("reviewsHint")}
            />
          </div>
        </div>
        <aside
          className="min-w-0 space-y-6 border bg-card p-4"
          aria-label={t("visitInfo")}
        >
          <section className="space-y-3">
            <h2 className="font-extrabold">{t("atPasar")}</h2>
            <Link
              href={{ pathname: "/pasar/[slug]", params: { slug } }}
              className="block min-h-11 py-2 font-semibold break-words text-pasar-text hover:underline"
            >
              {pasar.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {pasar.district}, {pasar.state}
            </p>
            <PasarLocationDialog
              location={pasar.location}
              name={pasar.name}
              address={pasar.address}
              backLabel={t("backToStall")}
            />
            <p className="text-xs text-muted-foreground">
              {t("marketLocationNote")}
            </p>
          </section>
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
              <p className="text-xs text-muted-foreground">{t("daysNote")}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
