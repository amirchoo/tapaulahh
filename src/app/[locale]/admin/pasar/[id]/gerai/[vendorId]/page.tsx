import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/admin/back-link";
import { DeleteButton } from "@/components/admin/delete-button";
import { VendorForm } from "@/components/admin/vendor-form";
import { MenuEditor } from "@/components/admin/menu-editor";
import { ContentPage } from "@/components/layout/content-page";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import {
  deleteVendorAction,
  deleteVendorItemAction,
  moveVendorItemAction,
  saveVendorItemAction,
} from "@/lib/admin/actions";
import { getAdminPasar, getAdminVendor } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getVendorCategories } from "@/lib/pasar/queries";

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/pasar/[id]/gerai/[vendorId]">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Admin" });
  return {
    title: t("vendorForm.editTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminVendorPage({
  params,
}: PageProps<"/[locale]/admin/pasar/[id]/gerai/[vendorId]">) {
  const locale = await initLocale(params);
  const { id, vendorId } = await params;
  await requireAdmin(locale, {
    pathname: "/admin/pasar/[id]/gerai/[vendorId]",
    params: { id, vendorId },
  });
  if (!UUID_RE.test(id) || !UUID_RE.test(vendorId)) notFound();
  const [pasar, vendor, categories] = await Promise.all([
    getAdminPasar(id),
    getAdminVendor(id, vendorId),
    getVendorCategories(),
  ]);
  if (!pasar || !vendor) notFound();
  const t = await getTranslations("Admin");

  return (
    <ContentPage title={vendor.name} subtitle={pasar.name}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackLink href={{ pathname: "/admin/pasar/[id]", params: { id } }}>
          {pasar.name}
        </BackLink>
        {vendor.status === "active" && pasar.status === "active" && (
          <Link
            href={{
              pathname: "/pasar/[slug]/[vendor]",
              params: { slug: pasar.slug, vendor: vendor.slug },
            }}
            target="_blank"
            className="inline-flex h-11 items-center gap-1 text-sm font-semibold underline underline-offset-4"
          >
            {t("viewPublic")}
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>

      <section id="menu" className="scroll-mt-4 space-y-3">
        <div>
          <h2 className="text-lg font-extrabold">
            {t("menu.title", { count: vendor.items.length })}
          </h2>
          <p className="text-sm text-muted-foreground">{t("menu.subtitle")}</p>
        </div>
        <MenuEditor
          parentId={vendor.id}
          items={vendor.items}
          actions={{
            save: saveVendorItemAction,
            remove: deleteVendorItemAction,
            move: moveVendorItemAction,
          }}
          photoBase={`vendors/${vendor.id}/items`}
          bucket="pasar-photos"
          ns="Admin.menu"
        />
      </section>

      <section className="space-y-3 pt-4">
        <h2 className="text-lg font-extrabold">{t("vendorForm.editTitle")}</h2>
        <VendorForm
          id={vendor.id}
          pasarId={id}
          vendor={vendor}
          categories={categories}
          pasarDays={[]}
        />
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-extrabold">{t("dangerZone")}</h2>
        <DeleteButton
          action={deleteVendorAction}
          fields={{ id: vendor.id, pasarId: id }}
          label={t("vendorForm.delete")}
          confirmText={t("vendorForm.deleteConfirm", { name: vendor.name })}
        />
      </section>
    </ContentPage>
  );
}
