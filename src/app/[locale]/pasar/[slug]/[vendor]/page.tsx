import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MapPlaceholder } from "@/components/layout/map-placeholder";
import { PanelBody, PanelHeader, Placeholder } from "@/components/layout/panel";
import { SplitView } from "@/components/layout/split-view";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { titleFromSlug } from "@/lib/slug";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/pasar/[slug]/[vendor]">): Promise<Metadata> {
  const { slug, vendor } = await params;
  return { title: `${titleFromSlug(vendor)} · ${titleFromSlug(slug)}` };
}

export default async function VendorPage({
  params,
}: PageProps<"/[locale]/pasar/[slug]/[vendor]">) {
  await initLocale(params);
  const { slug, vendor } = await params;
  const t = await getTranslations("Vendor");

  return (
    <SplitView
      main={<MapPlaceholder section="pasar" />}
      panel={
        <>
          <div className="px-2 pt-2 lg:px-4 lg:pt-4">
            <Link
              href={`/pasar/${slug}`}
              className="inline-flex h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ChevronLeft className="size-4" aria-hidden />
              {t("back")}: {titleFromSlug(slug)}
            </Link>
          </div>
          <PanelHeader eyebrow={t("eyebrow")} title={titleFromSlug(vendor)} />
          <PanelBody>
            <Placeholder>{t("placeholder")}</Placeholder>
          </PanelBody>
        </>
      }
    />
  );
}
