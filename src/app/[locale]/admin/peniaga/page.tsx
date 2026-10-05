import { ExternalLink, MapPin, Store } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { BackLink } from "@/components/admin/back-link";
import { CONTROL_CLASS } from "@/components/admin/fields";
import { ContentPage } from "@/components/layout/content-page";
import { Placeholder } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { reviewBusinessAction } from "@/lib/admin/actions";
import { getAdminBusinesses, type AdminBusiness } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { googleMapsUrl } from "@/lib/geo/parse-location";
import { formatWhatsapp, instagramUrl, whatsappUrl } from "@/lib/kedai/contact";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/peniaga">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "AdminSellers" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** Approve or reject Peniaga Kecil businesses. */
export default async function AdminSellersPage({
  params,
}: PageProps<"/[locale]/admin/peniaga">) {
  const locale = await initLocale(params);
  await requireAdmin(locale, "/admin/peniaga");
  const [t, tAdmin, businesses] = await Promise.all([
    getTranslations("AdminSellers"),
    getTranslations("Admin"),
    getAdminBusinesses(),
  ]);
  const groups = (["pending", "rejected", "approved"] as const).map(
    (status) => ({
      status,
      items: businesses.filter((b) => b.status === status),
    }),
  );

  return (
    <ContentPage title={t("title")} subtitle={t("subtitle")}>
      <BackLink href="/admin">{tAdmin("title")}</BackLink>
      {businesses.length === 0 && <Placeholder>{t("empty")}</Placeholder>}
      {groups.map(
        ({ status, items }) =>
          items.length > 0 && (
            <section key={status} className="space-y-3">
              <h2 className="text-lg font-extrabold">
                {t(`groups.${status}`)} ({items.length})
              </h2>
              <ul className="space-y-3">
                {items.map((b) => (
                  <li key={b.id}>
                    <BusinessCard business={b} />
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}
    </ContentPage>
  );
}

async function BusinessCard({ business: b }: { business: AdminBusiness }) {
  const t = await getTranslations("AdminSellers");
  const format = await getFormatter();

  return (
    <article
      className={cn(
        "space-y-3 border bg-card p-4",
        b.status === "pending" && "border-2 border-pasar",
      )}
    >
      <div className="flex gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden bg-kedai/15 text-kedai">
          {b.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logo_url} alt="" className="size-full object-cover" />
          ) : (
            <Store className="size-6" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="font-extrabold">{b.name}</h3>
          <p className="text-sm text-muted-foreground">
            {[b.categoryName, `${b.district}, ${b.state}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("submittedBy", {
              name: b.ownerName ?? t("noName"),
              date: format.dateTime(new Date(b.created_at), {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
            })}
          </p>
        </div>
      </div>

      {b.description && (
        <p className="text-sm whitespace-pre-line">{b.description}</p>
      )}

      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        {b.whatsapp && (
          <>
            <dt className="font-semibold">WhatsApp</dt>
            <dd>
              <a
                href={whatsappUrl(b.whatsapp, "")}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {formatWhatsapp(b.whatsapp)}
              </a>
            </dd>
          </>
        )}
        {b.instagram && (
          <>
            <dt className="font-semibold">Instagram</dt>
            <dd>
              <a
                href={instagramUrl(b.instagram)}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                @{b.instagram}
              </a>
            </dd>
          </>
        )}
        <dt className="font-semibold">{t("location")}</dt>
        <dd>
          {b.location ? (
            <a
              href={googleMapsUrl(b.location)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-4"
            >
              <MapPin className="size-3.5" aria-hidden />
              {t("checkLocation")}
            </a>
          ) : (
            <span className="text-muted-foreground">{t("noLocation")}</span>
          )}
        </dd>
        <dt className="font-semibold">{t("catalog")}</dt>
        <dd>{t("items", { count: b.itemCount })}</dd>
      </dl>

      {b.status === "rejected" && b.review_note && (
        <p className="border-l-2 border-destructive pl-3 text-sm">
          <span className="font-semibold">{t("note")}: </span>
          {b.review_note}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-3 border-t pt-3">
        {b.status !== "approved" && (
          <form action={reviewBusinessAction}>
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="decision" value="approve" />
            <Button
              type="submit"
              className="h-11 bg-cta px-4 font-bold text-on-cta hover:bg-cta/90"
            >
              {t("approve")}
            </Button>
          </form>
        )}
        {b.status === "approved" && (
          <Link
            href={{ pathname: "/kedai/[slug]", params: { slug: b.slug } }}
            target="_blank"
            className="inline-flex h-11 items-center gap-1 text-sm font-semibold underline underline-offset-4"
          >
            {t("viewPublic")}
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        )}
        {b.status !== "rejected" && (
          <details className="min-w-0 flex-1">
            <summary className="inline-flex h-11 cursor-pointer items-center border px-4 text-sm font-semibold">
              {b.status === "approved" ? t("unpublish") : t("reject")}
            </summary>
            <form action={reviewBusinessAction} className="mt-2 space-y-2">
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="decision" value="reject" />
              <label
                htmlFor={`note-${b.id}`}
                className="block text-sm font-semibold"
              >
                {t("noteLabel")}
              </label>
              <textarea
                id={`note-${b.id}`}
                name="note"
                rows={2}
                maxLength={500}
                placeholder={t("notePlaceholder")}
                className={cn(CONTROL_CLASS, "py-3")}
              />
              <Button type="submit" variant="destructive" className="h-11 px-4">
                {b.status === "approved" ? t("unpublish") : t("reject")}
              </Button>
            </form>
          </details>
        )}
      </div>
    </article>
  );
}
