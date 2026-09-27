import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentPage } from "@/components/layout/content-page";
import { Placeholder } from "@/components/layout/panel";
import { initLocale } from "@/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Login" });
  return { title: t("title"), robots: { index: false } };
}

export default async function LoginPage({
  params,
}: PageProps<"/[locale]/login">) {
  await initLocale(params);
  const t = await getTranslations("Login");
  const tCommon = await getTranslations("Common");

  return (
    <ContentPage title={t("title")} subtitle={t("subtitle")}>
      <Placeholder>{tCommon("comingSoon")}</Placeholder>
      <p className="text-sm text-muted-foreground">{t("note")}</p>
    </ContentPage>
  );
}
