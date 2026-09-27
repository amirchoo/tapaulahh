import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentPage } from "@/components/layout/content-page";
import { Placeholder } from "@/components/layout/panel";
import { initLocale } from "@/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/akaun/kedai">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "AkaunKedai" });
  return { title: t("title"), robots: { index: false } };
}

export default async function AkaunKedaiPage({
  params,
}: PageProps<"/[locale]/akaun/kedai">) {
  await initLocale(params);
  const t = await getTranslations("AkaunKedai");

  return (
    <ContentPage title={t("title")}>
      <Placeholder>{t("placeholder")}</Placeholder>
    </ContentPage>
  );
}
