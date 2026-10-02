import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPage } from "@/components/auth/auth-page";
import { initLocale } from "@/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/daftar">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("signupTitle"), robots: { index: false } };
}

export default async function DaftarPage({
  params,
  searchParams,
}: PageProps<"/[locale]/daftar">) {
  const locale = await initLocale(params);
  return <AuthPage locale={locale} mode="signup" searchParams={searchParams} />;
}
