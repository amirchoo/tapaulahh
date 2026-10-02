import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/admin/back-link";
import { PasarForm } from "@/components/admin/pasar-form";
import { ContentPage } from "@/components/layout/content-page";
import { initLocale } from "@/i18n/server";
import { requireAdmin } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/pasar/baru">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Admin" });
  return {
    title: t("pasarForm.newTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function NewPasarPage({
  params,
}: PageProps<"/[locale]/admin/pasar/baru">) {
  const locale = await initLocale(params);
  await requireAdmin(locale, "/admin/pasar/baru");
  const t = await getTranslations("Admin");

  return (
    <ContentPage title={t("pasarForm.newTitle")}>
      <BackLink href="/admin">{t("title")}</BackLink>
      {/* New id now, so photos can be uploaded into its folder before saving. */}
      <PasarForm id={crypto.randomUUID()} pasar={null} />
    </ContentPage>
  );
}
