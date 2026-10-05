import { AtSign, Clock, MessageCircle, Store, Truck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BusinessAreaMap } from "@/components/kedai/business-area-map";
import { PanelBody, PanelHeader } from "@/components/layout/panel";
import { SplitView } from "@/components/layout/split-view";
import { MenuList } from "@/components/pasar/menu-list";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { Button } from "@/components/ui/button";
import { initLocale } from "@/i18n/server";
import { instagramUrl, whatsappUrl } from "@/lib/kedai/contact";
import { getBusinessBySlug } from "@/lib/kedai/queries";
import { getReviews } from "@/lib/reviews/queries";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/kedai/[slug]">): Promise<Metadata> {
  const locale = await initLocale(params);
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return {};
  const t = await getTranslations({ locale, namespace: "KedaiDetail" });
  return {
    title: business.name,
    description:
      business.description ??
      t("metaDescription", {
        name: business.name,
        district: business.district,
      }),
    openGraph: business.logoUrl ? { images: [business.logoUrl] } : undefined,
  };
}

export default async function KedaiDetailPage({
  params,
}: PageProps<"/[locale]/kedai/[slug]">) {
  const locale = await initLocale(params);
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();
  const [t, tKedai, reviews] = await Promise.all([
    getTranslations("KedaiDetail"),
    getTranslations("Kedai"),
    getReviews("business", business.id),
  ]);
  const category = business.category
    ? locale === "en"
      ? business.category.nameEn
      : business.category.nameMs
    : t("eyebrow");

  return (
    <SplitView
      main={
        <section aria-label={tKedai("mapLabel")} className="relative h-full">
          <BusinessAreaMap business={business} />
          <p className="pointer-events-none absolute top-12 left-3 max-w-[70%] border bg-card/90 px-3 py-1.5 text-xs font-semibold">
            {tKedai("mapNote")}
          </p>
        </section>
      }
      panel={
        <>
          <div className="flex items-start gap-3 pr-4 lg:pr-6">
            <div className="min-w-0 flex-1">
              <PanelHeader
                section="kedai"
                eyebrow={category}
                title={business.name}
                subtitle={`${business.district}, ${business.state}`}
              />
            </div>
            <span className="relative mt-4 flex size-16 shrink-0 items-center justify-center overflow-hidden bg-kedai/15 text-kedai lg:mt-6">
              {business.logoUrl ? (
                <Image
                  src={business.logoUrl}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <Store className="size-7" aria-hidden />
              )}
            </span>
          </div>
          <PanelBody>
            <div className="space-y-6">
              {reviews.count > 0 && (
                <div className="-mt-2">
                  <RatingSummary summary={reviews} />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {business.whatsapp && (
                  <Button
                    asChild
                    className="h-11 gap-2 bg-cta px-4 font-bold text-on-cta hover:bg-cta/90"
                  >
                    <a
                      href={whatsappUrl(
                        business.whatsapp,
                        t("whatsappMessage", { name: business.name }),
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-4" aria-hidden />
                      {t("whatsapp")}
                    </a>
                  </Button>
                )}
                {business.instagram && (
                  <Button asChild variant="outline" className="h-11 gap-2 px-4">
                    <a
                      href={instagramUrl(business.instagram)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <AtSign className="size-4" aria-hidden />
                      {business.instagram}
                    </a>
                  </Button>
                )}
              </div>

              {business.description && (
                <p className="text-sm whitespace-pre-line">
                  {business.description}
                </p>
              )}

              {(business.hours || business.deliveryNotes) && (
                <dl className="space-y-2 text-sm">
                  {business.hours && (
                    <div className="flex gap-2">
                      <dt>
                        <Clock
                          className="mt-0.5 size-4 text-muted-foreground"
                          aria-label={t("hours")}
                        />
                      </dt>
                      <dd>{business.hours}</dd>
                    </div>
                  )}
                  {business.deliveryNotes && (
                    <div className="flex gap-2">
                      <dt>
                        <Truck
                          className="mt-0.5 size-4 text-muted-foreground"
                          aria-label={t("delivery")}
                        />
                      </dt>
                      <dd className="whitespace-pre-line">
                        {business.deliveryNotes}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              {business.items.length > 0 ? (
                <MenuList
                  title={t("catalog")}
                  items={business.items}
                  locale={locale}
                  soldOutLabel={t("soldOut")}
                  section="kedai"
                />
              ) : (
                <p className="border border-dashed p-4 text-sm text-muted-foreground">
                  {t("catalogEmpty")}
                </p>
              )}

              <ReviewsSection
                targetType="business"
                targetId={business.id}
                summary={reviews}
              />
            </div>
          </PanelBody>
        </>
      }
    />
  );
}
