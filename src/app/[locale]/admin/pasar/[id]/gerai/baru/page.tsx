import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/admin/back-link";
import { VendorForm } from "@/components/admin/vendor-form";
import { ContentPage } from "@/components/layout/content-page";
import { initLocale } from "@/i18n/server";
import { getAdminPasar } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getVendorCategories } from "@/lib/pasar/queries";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/pasar/[id]/gerai/baru">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Admin" });
  return {
    title: t("vendorForm.newTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function NewVendorPage({
  params,
}: PageProps<"/[locale]/admin/pasar/[id]/gerai/baru">) {
  const locale = await initLocale(params);
  const { id } = await params;
  await requireAdmin(locale, {
    pathname: "/admin/pasar/[id]/gerai/baru",
    params: { id },
  });
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [pasar, categories] = await Promise.all([
    getAdminPasar(id),
    getVendorCategories(),
  ]);
  if (!pasar) notFound();
  const t = await getTranslations("Admin");

  return (
    <ContentPage title={t("vendorForm.newTitle")} subtitle={pasar.name}>
      <BackLink href={{ pathname: "/admin/pasar/[id]", params: { id } }}>
        {pasar.name}
      </BackLink>
      <VendorForm
        id={crypto.randomUUID()}
        pasarId={id}
        vendor={null}
        categories={categories}
        pasarDays={[...new Set(pasar.schedules.map((s) => s.day_of_week))]}
      />
    </ContentPage>
  );
}
