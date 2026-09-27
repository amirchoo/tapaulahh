import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MapPlaceholder } from "@/components/layout/map-placeholder";
import { PanelBody, PanelHeader, Placeholder } from "@/components/layout/panel";
import { SplitView } from "@/components/layout/split-view";
import { initLocale } from "@/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/kedai">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Kedai" });
  return { title: t("title") };
}

export default async function KedaiPage({
  params,
}: PageProps<"/[locale]/kedai">) {
  await initLocale(params);
  const t = await getTranslations("Kedai");

  return (
    <SplitView
      main={<MapPlaceholder section="kedai" note={t("mapNote")} />}
      panel={
        <>
          <PanelHeader
            section="kedai"
            title={t("title")}
            subtitle={t("subtitle")}
          />
          <PanelBody>
            <Placeholder>{t("placeholder")}</Placeholder>
          </PanelBody>
        </>
      }
    />
  );
}
