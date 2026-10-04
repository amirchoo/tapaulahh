import { Car, MapPin, Navigation } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PanelBody, PanelHeader } from "@/components/layout/panel";
import { SplitView } from "@/components/layout/split-view";
import { formatTime } from "@/components/pasar/format";
import { PasarSpotMapLazy } from "@/components/pasar/pasar-spot-map-lazy";
import { PasarStatusNow } from "@/components/pasar/pasar-status-now";
import { PhotoStrip } from "@/components/pasar/photo-strip";
import { VendorCard } from "@/components/pasar/vendor-card";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { initLocale } from "@/i18n/server";
import { directionsUrl } from "@/lib/pasar/directions";
import { getPasarBySlug, getVendors } from "@/lib/pasar/queries";
import { WEEK, schedulesOn } from "@/lib/pasar/schedule";
import { getReviews } from "@/lib/reviews/queries";
import type { PasarDetail, Vendor } from "@/lib/pasar/types";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/pasar/[slug]">): Promise<Metadata> {
  const locale = await initLocale(params);
  const { slug } = await params;
  const pasar = await getPasarBySlug(slug);
  if (!pasar) return {};
  const t = await getTranslations({ locale, namespace: "Pasar" });
  const tDays = await getTranslations({ locale, namespace: "Days" });
  const days = WEEK.filter((d) => schedulesOn(pasar, d).length > 0)
    .map((d) => tDays(`long.${d}`))
    .join(", ");
  return {
    title: pasar.name,
    description:
      pasar.description ??
      t("metaDescription", {
        name: pasar.name,
        district: pasar.district,
        days,
      }),
    openGraph: pasar.photos[0] ? { images: [pasar.photos[0]] } : undefined,
  };
}

export default async function PasarPage({
  params,
}: PageProps<"/[locale]/pasar/[slug]">) {
  const locale = await initLocale(params);
  const { slug } = await params;
  const pasar = await getPasarBySlug(slug);
  if (!pasar) notFound();
  const [vendors, reviews] = await Promise.all([
    getVendors(pasar.id),
    getReviews("pasar", pasar.id),
  ]);
  const t = await getTranslations("Pasar");

  return (
    <SplitView
      main={<PasarSpotMapLazy location={pasar.location} label={pasar.name} />}
      panel={
        <>
          <PanelHeader
            eyebrow={t("eyebrow")}
            title={pasar.name}
            subtitle={`${pasar.district}, ${pasar.state}`}
          />
          <PanelBody>
            <div className="space-y-6">
              <div className="-mt-2 space-y-1">
                <PasarStatusNow pasar={pasar} />
                <RatingSummary summary={reviews} />
              </div>
              <PhotoStrip photos={pasar.photos} alt={pasar.name} />
              <Hours pasar={pasar} locale={locale} />
              <Where pasar={pasar} />
              {pasar.description && (
                <section className="space-y-1">
                  <h2 className="font-extrabold">{t("about")}</h2>
                  <p className="text-sm whitespace-pre-line">
                    {pasar.description}
                  </p>
                </section>
              )}
              <VendorList pasar={pasar} vendors={vendors} locale={locale} />
              <ReviewsSection
                targetType="pasar"
                targetId={pasar.id}
                summary={reviews}
              />
            </div>
          </PanelBody>
        </>
      }
    />
  );
}

async function Hours({
  pasar,
  locale,
}: {
  pasar: PasarDetail;
  locale: Locale;
}) {
  const t = await getTranslations("Pasar");
  const tDays = await getTranslations("Days");
  const tStatus = await getTranslations("Status");
  const days = WEEK.filter((d) => schedulesOn(pasar, d).length > 0);

  return (
    <section className="space-y-2">
      <h2 className="font-extrabold">{t("days")}</h2>
      <dl className="divide-y border text-sm">
        {days.map((day) => (
          <div key={day} className="flex justify-between gap-4 px-3 py-2">
            <dt className="font-semibold">{tDays(`long.${day}`)}</dt>
            <dd className="text-right text-muted-foreground">
              {schedulesOn(pasar, day)
                .map((s) =>
                  tStatus("hours", {
                    start: formatTime(s.startTime, locale),
                    end: formatTime(s.endTime, locale),
                  }),
                )
                .join(", ")}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

async function Where({ pasar }: { pasar: PasarDetail }) {
  const t = await getTranslations("Pasar");
  return (
    <section className="space-y-3">
      {pasar.address && (
        <p className="flex gap-2 text-sm">
          <MapPin
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          {pasar.address}
        </p>
      )}
      {pasar.parkingNotes && (
        <p className="flex gap-2 text-sm">
          <Car
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span>
            <span className="font-semibold">{t("parking")}: </span>
            {pasar.parkingNotes}
          </span>
        </p>
      )}
      <Button asChild variant="outline" className="h-11 gap-2 px-4">
        <a
          href={directionsUrl(pasar.location)}
          target="_blank"
          rel="noreferrer"
        >
          <Navigation className="size-4" aria-hidden />
          {t("directions")}
        </a>
      </Button>
    </section>
  );
}

async function VendorList({
  pasar,
  vendors,
  locale,
}: {
  pasar: PasarDetail;
  vendors: Vendor[];
  locale: Locale;
}) {
  const t = await getTranslations("Pasar");

  // Group by category in the categories' own order; no category goes last.
  const groups = new Map<
    string,
    { name: string; order: number; items: Vendor[] }
  >();
  for (const vendor of vendors) {
    const c = vendor.category;
    const key = c?.id ?? "none";
    const group = groups.get(key) ?? {
      name: c ? (locale === "en" ? c.nameEn : c.nameMs) : t("otherCategory"),
      order: c?.sortOrder ?? Number.MAX_SAFE_INTEGER,
      items: [],
    };
    group.items.push(vendor);
    groups.set(key, group);
  }
  const sorted = [...groups.values()].sort((a, b) => a.order - b.order);

  return (
    <section className="space-y-3">
      <h2 className="font-extrabold">
        {t("vendorsTitle", { count: vendors.length })}
      </h2>
      {vendors.length === 0 ? (
        <p className="border border-dashed p-4 text-sm text-muted-foreground">
          {t("vendorsEmpty")}
        </p>
      ) : (
        sorted.map((group) => (
          <div key={group.name} className="space-y-2">
            <h3 className="text-xs font-bold tracking-wide text-pasar-text uppercase">
              {group.name}
            </h3>
            <ul className="grid grid-cols-2 gap-3">
              {group.items.map((vendor) => (
                <li key={vendor.id} className="min-w-0">
                  <VendorCard vendor={vendor} pasarSlug={pasar.slug} />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
