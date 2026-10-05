import { CircleCheck, CircleX, ExternalLink, Hourglass } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { MenuEditor } from "@/components/admin/menu-editor";
import { BusinessForm } from "@/components/kedai/business-form";
import { ContentPage } from "@/components/layout/content-page";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { requireUser } from "@/lib/auth/session";
import {
  deleteBusinessAction,
  deleteCatalogItemAction,
  moveCatalogItemAction,
  saveCatalogItemAction,
} from "@/lib/kedai/actions";
import { getMyBusiness, type OwnerBusiness } from "@/lib/kedai/owner";
import { getBusinessCategories } from "@/lib/kedai/queries";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/akaun/kedai">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "AkaunKedai" });
  return { title: t("title"), robots: { index: false } };
}

/** Register a Peniaga Kecil business, then manage it and its catalog. */
export default async function AkaunKedaiPage({
  params,
}: PageProps<"/[locale]/akaun/kedai">) {
  const locale = await initLocale(params);
  const user = await requireUser(locale, "/akaun/kedai");
  const [business, categories] = await Promise.all([
    getMyBusiness(user.id),
    getBusinessCategories(),
  ]);
  const t = await getTranslations("AkaunKedai");

  if (!business) {
    return (
      <ContentPage title={t("registerTitle")} subtitle={t("registerSubtitle")}>
        <ol className="grid gap-2 text-sm sm:grid-cols-3">
          {(["step1", "step2", "step3"] as const).map((step, i) => (
            <li key={step} className="flex gap-2 border bg-card p-3">
              <span className="font-heading text-lg leading-none font-extrabold text-kedai">
                {i + 1}
              </span>
              {t(step)}
            </li>
          ))}
        </ol>
        <BusinessForm
          id={crypto.randomUUID()}
          userId={user.id}
          business={null}
          categories={categories}
        />
      </ContentPage>
    );
  }

  return (
    <ContentPage title={business.name}>
      <StatusBanner business={business} />

      <section id="katalog" className="scroll-mt-4 space-y-3">
        <div>
          <h2 className="text-lg font-extrabold">
            {t("catalogTitle", { count: business.items.length })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("catalogSubtitle")}
          </p>
        </div>
        <MenuEditor
          parentId={business.id}
          items={business.items}
          actions={{
            save: saveCatalogItemAction,
            remove: deleteCatalogItemAction,
            move: moveCatalogItemAction,
          }}
          photoBase={`${user.id}/items`}
          bucket="business-photos"
          ns="Catalog"
        />
      </section>

      <section className="space-y-3 pt-4">
        <h2 className="text-lg font-extrabold">{t("detailsTitle")}</h2>
        <BusinessForm
          id={business.id}
          userId={user.id}
          business={business}
          categories={categories}
        />
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-extrabold">{t("deleteTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("deleteHint")}</p>
        <DeleteButton
          action={deleteBusinessAction}
          fields={{ id: business.id }}
          label={t("delete")}
          confirmText={t("deleteConfirm", { name: business.name })}
        />
      </section>
    </ContentPage>
  );
}

async function StatusBanner({ business }: { business: OwnerBusiness }) {
  const t = await getTranslations("AkaunKedai");
  const { status } = business;
  const Icon =
    status === "approved"
      ? CircleCheck
      : status === "rejected"
        ? CircleX
        : Hourglass;

  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 border-2 p-4",
        status === "approved" && "border-open",
        status === "pending" && "border-pasar",
        status === "rejected" && "border-destructive",
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "mt-0.5 size-5 shrink-0",
          status === "approved" && "text-open",
          status === "pending" && "text-pasar-text",
          status === "rejected" && "text-destructive",
        )}
      />
      <div className="space-y-1 text-sm">
        <p className="font-bold">{t(`status.${status}.title`)}</p>
        <p className="text-muted-foreground">{t(`status.${status}.body`)}</p>
        {status === "rejected" && business.review_note && (
          <p>
            <span className="font-semibold">{t("adminNote")}: </span>
            {business.review_note}
          </p>
        )}
        {status === "approved" && (
          <Link
            href={{
              pathname: "/kedai/[slug]",
              params: { slug: business.slug },
            }}
            className="inline-flex h-9 items-center gap-1 font-semibold underline underline-offset-4"
          >
            {t("viewPublic")}
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
