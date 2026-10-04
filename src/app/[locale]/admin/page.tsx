import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StatusBadge } from "@/components/admin/back-link";
import { ContentPage } from "@/components/layout/content-page";
import { Placeholder } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { getAdminPasars } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { WEEK } from "@/lib/pasar/schedule";

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
  await requireAdmin(locale, "/admin");
  const t = await getTranslations("Admin");
  const tDays = await getTranslations("Days");
  const pasars = await getAdminPasars();

  return (
    <ContentPage title={t("title")} subtitle={t("subtitle")}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-extrabold">
          {t("pasarList.title", { count: pasars.length })}
        </h2>
        <Button
          asChild
          className="h-11 gap-1.5 bg-cta px-4 font-bold text-on-cta hover:bg-cta/90"
        >
          <Link href="/admin/pasar/baru">
            <Plus className="size-4" aria-hidden />
            {t("pasarList.add")}
          </Link>
        </Button>
      </div>

      {pasars.length === 0 ? (
        <Placeholder>{t("pasarList.empty")}</Placeholder>
      ) : (
        <ul className="divide-y overflow-hidden border bg-card">
          {pasars.map((pasar) => (
            <li key={pasar.id}>
              <Link
                href={{
                  pathname: "/admin/pasar/[id]",
                  params: { id: pasar.id },
                }}
                className="flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted focus-visible:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {pasar.name}
                    {pasar.status === "inactive" && (
                      <StatusBadge tone="muted">
                        {t("pasarStatus.inactive")}
                      </StatusBadge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pasar.district}, {pasar.state} ·{" "}
                    {WEEK.filter((d) => pasar.days.includes(d))
                      .map((d) => tDays(`short.${d}`))
                      .join(", ") || t("pasarList.noDays")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("pasarList.stalls", { count: pasar.vendorCount })}
                  </p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ContentPage>
  );
}
