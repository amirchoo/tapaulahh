import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ContentPage } from "@/components/layout/content-page";
import { Placeholder } from "@/components/layout/panel";
import { initLocale } from "@/i18n/server";
import { getProfile, requireUser } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AdminPage({
  params,
}: PageProps<"/[locale]/admin">) {
  const locale = await initLocale(params);
  const user = await requireUser(locale, "/admin");
  // Hide the admin area from everyone else (Part 8 adds the real tools).
  if ((await getProfile(user.id))?.role !== "admin") notFound();
  const t = await getTranslations("Admin");

  return (
    <ContentPage title={t("title")}>
      <Placeholder>{t("placeholder")}</Placeholder>
    </ContentPage>
  );
}
