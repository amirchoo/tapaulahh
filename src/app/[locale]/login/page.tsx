import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPage } from "@/components/auth/auth-page";
import { initLocale } from "@/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("loginTitle"), robots: { index: false } };
}

export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/login">) {
  const locale = await initLocale(params);
  return <AuthPage locale={locale} mode="login" searchParams={searchParams} />;
}
