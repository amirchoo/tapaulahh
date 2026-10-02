import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NameForm } from "@/components/auth/name-form";
import { ContentPage } from "@/components/layout/content-page";
import { getPathname } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { safeNextPath } from "@/lib/auth/next-path";
import { getProfile, requireUser } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/akaun/selamat-datang">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Welcome" });
  return { title: t("title"), robots: { index: false } };
}

/** First stop after a new email sign-up: ask for a display name. */
export default async function WelcomePage({
  params,
  searchParams,
}: PageProps<"/[locale]/akaun/selamat-datang">) {
  const locale = await initLocale(params);
  const user = await requireUser(locale, "/akaun/selamat-datang");
  const profile = await getProfile(user.id);
  const t = await getTranslations("Welcome");

  const { next: rawNext } = await searchParams;
  const next =
    safeNextPath(typeof rawNext === "string" ? rawNext : null) ??
    getPathname({ href: "/akaun", locale });

  return (
    <ContentPage title={t("title")} subtitle={t("subtitle")}>
      <div className="max-w-md space-y-4">
        <NameForm
          defaultName={profile?.displayName ?? ""}
          next={next}
          submitLabel={t("continue")}
          primary
        />
        {/* Plain <a>: `next` is already a full localized path. */}
        <a
          href={next}
          className="inline-flex h-11 items-center text-sm font-semibold text-muted-foreground underline underline-offset-4"
        >
          {t("skip")}
        </a>
      </div>
    </ContentPage>
  );
}
