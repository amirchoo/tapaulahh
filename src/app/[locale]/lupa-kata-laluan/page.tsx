import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPage } from "@/components/auth/auth-page";
import { initLocale } from "@/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lupa-kata-laluan">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("forgotTitle"), robots: { index: false } };
}

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: PageProps<"/[locale]/lupa-kata-laluan">) {
  const locale = await initLocale(params);
  return <AuthPage locale={locale} mode="forgot" searchParams={searchParams} />;
}
