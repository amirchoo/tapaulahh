import { Car, ChevronLeft, MapPin, Navigation } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { formatTime } from "@/components/pasar/format";
import { PasarLocationDialog } from "@/components/pasar/pasar-location-dialog";
import { PasarStatusNow } from "@/components/pasar/pasar-status-now";
import { PhotoStrip } from "@/components/pasar/photo-strip";
import { VendorCard } from "@/components/pasar/vendor-card";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
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
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-12 lg:px-6 lg:pt-6">
      <Link
        href="/pasar"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {t("backToPasars")}
      </Link>
      <header className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-pasar-text">{t("eyebrow")}</span> ·{" "}
            {pasar.district}, {pasar.state}
          </p>
          <h1 className="mt-2 max-w-4xl text-3xl font-extrabold tracking-tight break-words lg:text-4xl">
            {pasar.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <PasarStatusNow pasar={pasar} />
            <RatingSummary summary={reviews} />
          </div>
          <div className="flex flex-wrap gap-2">
            <PasarLocationDialog
              location={pasar.location}
              name={pasar.name}
              address={pasar.address}
              backLabel={t("backToStalls")}
            />
            <Button asChild variant="outline" className="h-11 gap-2 px-4">
              <a
                href={directionsUrl(pasar.location)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-4" aria-hidden />
                {t("directions")}
              </a>
            </Button>
          </div>
        </div>
      </header>
      <nav
        aria-label={t("pageSections")}
        className="mt-6 mb-6 flex flex-wrap gap-x-6 border-b"
      >
        {[
          ["gerai", t("vendorsTitle", { count: vendors.length })],
          ["maklumat", t("information")],
          ["ulasan", t("reviewsNav")],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex min-h-11 items-center border-b-2 border-transparent text-sm font-semibold outline-none hover:border-pasar hover:text-pasar-text focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {label}
          </a>
        ))}
      </nav>
      <VendorList pasar={pasar} vendors={vendors} locale={locale} />
      <section
        id="maklumat"
        aria-labelledby="pasar-information"
        className="mt-10 scroll-mt-4 space-y-5 border-t pt-6"
      >
        <h2
          id="pasar-information"
          className="text-2xl font-extrabold tracking-tight"
        >
          {t("information")}
        </h2>
        <div className="grid items-start gap-6 md:grid-cols-2">
          <Hours pasar={pasar} locale={locale} />
          <Where pasar={pasar} />
        </div>
        {pasar.description && (
          <section className="max-w-3xl space-y-2">
            <h3 className="font-extrabold">{t("about")}</h3>
            <p className="whitespace-pre-line">{pasar.description}</p>
          </section>
        )}
        <PhotoStrip photos={pasar.photos} alt={pasar.name} />
      </section>
      <div className="mt-10 max-w-3xl border-t pt-6">
        <ReviewsSection
          targetType="pasar"
          targetId={pasar.id}
          summary={reviews}
          heading={t("reviewsTitle")}
          description={t("reviewsHint")}
        />
      </div>
    </div>
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
      <h3 className="font-extrabold">{t("days")}</h3>
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
      <h3 className="font-extrabold">{t("location")}</h3>
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
    <section
      id="gerai"
      aria-labelledby="pasar-stalls"
      className="scroll-mt-4 space-y-5"
    >
      <div>
        <h2
          id="pasar-stalls"
          className="text-2xl font-extrabold tracking-tight"
        >
          {t("vendorsTitle", { count: vendors.length })}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("vendorsHint")}</p>
      </div>
      {vendors.length === 0 ? (
        <p className="border border-dashed p-4 text-sm text-muted-foreground">
          {t("vendorsEmpty")}
        </p>
      ) : (
        sorted.map((group) => (
          <div key={group.name} className="space-y-3">
            <h3 className="text-xs font-bold tracking-wide text-pasar-text uppercase">
              {group.name}
            </h3>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
