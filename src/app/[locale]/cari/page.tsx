import { Search } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentPage } from "@/components/layout/content-page";
import { initLocale } from "@/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cari">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Cari" });
  return { title: t("title") };
}

export default async function CariPage({
  params,
}: PageProps<"/[locale]/cari">) {
  await initLocale(params);
  const t = await getTranslations("Cari");

  return (
    <ContentPage title={t("title")}>
      <form role="search">
        <label htmlFor="q" className="sr-only">
          {t("label")}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="q"
            name="q"
            type="search"
            placeholder={t("placeholder")}
            className="h-12 w-full rounded-xl border bg-card pr-4 pl-12 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </form>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
    </ContentPage>
  );
}
