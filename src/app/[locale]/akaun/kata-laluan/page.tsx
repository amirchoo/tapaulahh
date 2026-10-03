import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PasswordForm } from "@/components/auth/password-form";
import { BackLink } from "@/components/admin/back-link";
import { ContentPage } from "@/components/layout/content-page";
import { initLocale } from "@/i18n/server";
import { safeNextPath } from "@/lib/auth/next-path";
import { requireUser } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/akaun/kata-laluan">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("passwordTitle"), robots: { index: false } };
}

/** Set a new password: after "forgot password", or from My account. */
export default async function PasswordPage({
  params,
  searchParams,
}: PageProps<"/[locale]/akaun/kata-laluan">) {
  const locale = await initLocale(params);
  await requireUser(locale, "/akaun/kata-laluan");
  const t = await getTranslations("Auth");
  const tAkaun = await getTranslations("Akaun");
  const { next } = await searchParams;

  return (
    <ContentPage title={t("passwordTitle")} subtitle={t("passwordSubtitle")}>
      <BackLink href="/akaun">{tAkaun("title")}</BackLink>
      <div className="max-w-md">
        <PasswordForm
          next={
            safeNextPath(typeof next === "string" ? next : null) ?? undefined
          }
        />
      </div>
    </ContentPage>
  );
}
