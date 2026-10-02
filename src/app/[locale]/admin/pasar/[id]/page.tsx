import { ChevronRight, ExternalLink, Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BackLink, StatusBadge } from "@/components/admin/back-link";
import { DeleteButton } from "@/components/admin/delete-button";
import { PasarForm } from "@/components/admin/pasar-form";
import { ContentPage } from "@/components/layout/content-page";
import { Placeholder } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { deletePasarAction } from "@/lib/admin/actions";
import { getAdminPasar } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { WEEK } from "@/lib/pasar/schedule";

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/pasar/[id]">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Admin" });
  return {
    title: t("pasarForm.editTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminPasarPage({
  params,
}: PageProps<"/[locale]/admin/pasar/[id]">) {
  const locale = await initLocale(params);
  const { id } = await params;
  await requireAdmin(locale, { pathname: "/admin/pasar/[id]", params: { id } });
  if (!UUID_RE.test(id)) notFound();
  const pasar = await getAdminPasar(id);
  if (!pasar) notFound();
  const t = await getTranslations("Admin");
  const tDays = await getTranslations("Days");

  return (
    <ContentPage title={pasar.name}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackLink href="/admin">{t("title")}</BackLink>
        {pasar.status === "active" && (
          <Link
            href={{ pathname: "/pasar/[slug]", params: { slug: pasar.slug } }}
            target="_blank"
            className="inline-flex h-11 items-center gap-1 text-sm font-semibold underline underline-offset-4"
          >
            {t("viewPublic")}
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>

      <section id="gerai" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold">
            {t("vendorList.title", { count: pasar.vendors.length })}
          </h2>
          <Button
            asChild
            className="h-11 gap-1.5 rounded-xl bg-cta px-4 font-bold text-on-cta hover:bg-cta/90"
          >
            <Link
              href={{
                pathname: "/admin/pasar/[id]/gerai/baru",
                params: { id },
              }}
            >
              <Plus className="size-4" aria-hidden />
              {t("vendorList.add")}
            </Link>
          </Button>
        </div>
        {pasar.vendors.length === 0 ? (
          <Placeholder>{t("vendorList.empty")}</Placeholder>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {pasar.vendors.map((vendor) => (
              <li key={vendor.id}>
                <Link
                  href={{
                    pathname: "/admin/pasar/[id]/gerai/[vendorId]",
                    params: { id, vendorId: vendor.id },
                  }}
                  className="flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted focus-visible:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {vendor.name}
                      {vendor.status !== "active" && (
                        <StatusBadge
                          tone={
                            vendor.status === "pending" ? "pending" : "muted"
                          }
                        >
                          {t(`vendorStatus.${vendor.status}`)}
                        </StatusBadge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[
                        vendor.categoryName,
                        WEEK.filter((d) => vendor.usual_days.includes(d))
                          .map((d) => tDays(`short.${d}`))
                          .join(", "),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
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
      </section>

      <section className="space-y-3 pt-4">
        <h2 className="text-lg font-extrabold">{t("pasarForm.editTitle")}</h2>
        <PasarForm id={pasar.id} pasar={pasar} />
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-extrabold">{t("dangerZone")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("pasarForm.deleteHint")}
        </p>
        <DeleteButton
          action={deletePasarAction}
          fields={{ id: pasar.id }}
          label={t("pasarForm.delete")}
          confirmText={t("pasarForm.deleteConfirm", {
            name: pasar.name,
            count: pasar.vendors.length,
          })}
        />
      </section>
    </ContentPage>
  );
}
