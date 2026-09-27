import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MapPlaceholder } from "@/components/layout/map-placeholder";
import { PanelBody, PanelHeader, Placeholder } from "@/components/layout/panel";
import { SplitView } from "@/components/layout/split-view";
import { initLocale } from "@/i18n/server";
import { titleFromSlug } from "@/lib/slug";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/kedai/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: titleFromSlug(slug) };
}

export default async function KedaiDetailPage({
  params,
}: PageProps<"/[locale]/kedai/[slug]">) {
  await initLocale(params);
  const { slug } = await params;
  const t = await getTranslations("KedaiDetail");
  const tKedai = await getTranslations("Kedai");

  return (
    <SplitView
      main={<MapPlaceholder section="kedai" note={tKedai("mapNote")} />}
      panel={
        <>
          <PanelHeader
            section="kedai"
            eyebrow={t("eyebrow")}
            title={titleFromSlug(slug)}
          />
          <PanelBody>
            <Placeholder>{t("placeholder")}</Placeholder>
          </PanelBody>
        </>
      }
    />
  );
}
