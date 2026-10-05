import {
  ChevronRight,
  Map as MapIcon,
  Search,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ContentPage } from "@/components/layout/content-page";
import { Button } from "@/components/ui/button";
import { getPathname, Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { POPULAR_FOODS } from "@/lib/pasar/popular-foods";
import { search, SEARCH_MAX, type SearchHit } from "@/lib/search/queries";
import { cn } from "@/lib/utils";

const queryFrom = (raw: string | string[] | undefined) =>
  typeof raw === "string" ? raw.trim().slice(0, SEARCH_MAX) : "";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/cari">): Promise<Metadata> {
  const locale = await initLocale(params);
  const t = await getTranslations({ locale, namespace: "Cari" });
  const q = queryFrom((await searchParams).q);
  // Result pages are endless variations of the same content: keep them out of Google.
  return q
    ? { title: `${q} · ${t("title")}`, robots: { index: false } }
    : { title: t("title") };
}

const KINDS = ["pasar", "vendor", "business"] as const;

export default async function CariPage({
  params,
  searchParams,
}: PageProps<"/[locale]/cari">) {
  const locale = await initLocale(params);
  const t = await getTranslations("Cari");
  const q = queryFrom((await searchParams).q);
  const hits = q ? await search(q) : [];

  return (
    <ContentPage title={t("title")}>
      <form
        role="search"
        action={getPathname({ href: "/cari", locale })}
        className="flex gap-2"
      >
        <label htmlFor="q" className="sr-only">
          {t("label")}
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            autoFocus={!q}
            maxLength={SEARCH_MAX}
            enterKeyHint="search"
            placeholder={t("placeholder")}
            className="h-12 w-full border bg-card pr-4 pl-12 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Button
          type="submit"
          className="h-12 bg-cta px-5 text-base font-bold text-on-cta hover:bg-cta/90"
        >
          {t("submit")}
        </Button>
      </form>

      {!q ? (
        <Suggestions title={t("popularTitle")} hint={t("hint")} />
      ) : hits.length === 0 ? (
        <div className="space-y-4">
          <p className="border border-dashed p-4 text-sm text-muted-foreground">
            {t("empty", { q })}
          </p>
          <Button asChild variant="outline" className="h-11 gap-2 px-4">
            <Link href="/pasar">
              <MapIcon className="size-4" aria-hidden />
              {t("seeMap")}
            </Link>
          </Button>
          <Suggestions title={t("tryInstead")} />
        </div>
      ) : (
        <div className="space-y-6">
          <p role="status" className="text-sm text-muted-foreground">
            {t("count", { count: hits.length, q })}
          </p>
          {KINDS.map((kind) => {
            const group = hits.filter((h) => h.kind === kind);
            if (group.length === 0) return null;
            return (
              <section key={kind} className="space-y-2">
                <h2
                  className={cn(
                    "text-xs font-bold tracking-wide uppercase",
                    kind === "business" ? "text-kedai" : "text-pasar-text",
                  )}
                >
                  {t(`groups.${kind}`)} ({group.length})
                </h2>
                <ul className="divide-y border bg-card">
                  {group.map((hit) => (
                    <li key={hit.id}>
                      <Result hit={hit} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </ContentPage>
  );
}

async function Result({ hit }: { hit: SearchHit }) {
  const t = await getTranslations("Cari");
  const href =
    hit.kind === "pasar"
      ? { pathname: "/pasar/[slug]" as const, params: { slug: hit.slug } }
      : hit.kind === "vendor" && hit.parentSlug
        ? {
            pathname: "/pasar/[slug]/[vendor]" as const,
            params: { slug: hit.parentSlug, vendor: hit.slug },
          }
        : { pathname: "/kedai/[slug]" as const, params: { slug: hit.slug } };
  const Icon =
    hit.kind === "pasar"
      ? MapIcon
      : hit.kind === "vendor"
        ? UtensilsCrossed
        : Store;
  const context =
    hit.kind === "vendor" && hit.context
      ? t("atPasar", { pasar: hit.context })
      : hit.context;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 outline-none hover:bg-muted focus-visible:bg-muted"
    >
      <span
        className={cn(
          "relative flex size-14 shrink-0 items-center justify-center overflow-hidden",
          hit.kind === "business"
            ? "bg-kedai/15 text-kedai"
            : "bg-pasar/15 text-pasar-text",
        )}
      >
        {hit.photo ? (
          <Image
            src={hit.photo}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <Icon className="size-6" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading font-bold">
          {hit.name}
        </span>
        {context && (
          <span className="block truncate text-sm text-muted-foreground">
            {context}
          </span>
        )}
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}

/** Popular food searches, as quick links. */
async function Suggestions({ title, hint }: { title: string; hint?: string }) {
  return (
    <section className="space-y-3">
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <h2 className="font-extrabold">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {POPULAR_FOODS.map((food) => (
          <li key={food}>
            <Link
              href={{ pathname: "/cari", query: { q: food } }}
              className="inline-flex h-11 items-center border bg-card px-4 text-sm font-semibold outline-none hover:border-pasar focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {food}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
