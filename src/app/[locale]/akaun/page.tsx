import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentPage } from "@/components/layout/content-page";
import { Placeholder } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/akaun">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Akaun" });
  return { title: t("title"), robots: { index: false } };
}

export default async function AkaunPage({
  params,
}: PageProps<"/[locale]/akaun">) {
  await initLocale(params);
  const t = await getTranslations("Akaun");

  return (
    <ContentPage title={t("title")}>
      <Placeholder>{t("placeholder")}</Placeholder>
      <Button asChild variant="outline" className="h-11 px-4">
        <Link href="/akaun/kedai">{t("manageKedai")}</Link>
      </Button>
    </ContentPage>
  );
}
