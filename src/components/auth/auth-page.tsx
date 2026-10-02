import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { ContentPage } from "@/components/layout/content-page";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { safeNextPath } from "@/lib/auth/next-path";
import { isGoogleEnabled } from "@/lib/auth/providers";
import { getCurrentUser } from "@/lib/auth/session";

type SearchParams = Record<string, string | string[] | undefined>;

/** /login and /daftar: same flow, different heading and a name field. */
export async function AuthPage({
  locale,
  mode,
  searchParams,
}: {
  locale: Locale;
  mode: "login" | "signup";
  searchParams: Promise<SearchParams>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNextPath(typeof rawNext === "string" ? rawNext : null);

  // Already signed in: carry on to where they were going.
  if (await getCurrentUser()) {
    redirect(next ?? getPathname({ href: "/akaun", locale }));
  }

  const t = await getTranslations("Auth");
  const urlError = error === "link" || error === "google" ? error : null;

  return (
    <ContentPage
      title={mode === "login" ? t("loginTitle") : t("signupTitle")}
      subtitle={mode === "login" ? t("loginSubtitle") : t("signupSubtitle")}
    >
      <div className="max-w-md space-y-6">
        <LoginForm
          mode={mode}
          next={next}
          googleEnabled={await isGoogleEnabled()}
          urlError={urlError}
        />
        <p className="border-t pt-4 text-sm text-muted-foreground">
          {t("browseNote")}
        </p>
      </div>
    </ContentPage>
  );
}
