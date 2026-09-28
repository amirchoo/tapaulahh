import { ChevronRight, Map as MapIcon, Search, Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { TonightPasars } from "@/components/home/tonight-pasars";
import { Button } from "@/components/ui/button";
import { getPathname, Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { POPULAR_FOODS } from "@/lib/pasar/popular-foods";
import { getPasars } from "@/lib/pasar/queries";
import { WEEK } from "@/lib/pasar/schedule";
import type { Pasar } from "@/lib/pasar/types";

function groupByDistrict(pasars: Pasar[]): [string, Pasar[]][] {
  const groups: Record<string, Pasar[]> = {};
  for (const pasar of pasars) (groups[pasar.district] ??= []).push(pasar);
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([district, list]) => [
      district,
      list.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      ),
    ]);
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await initLocale(params);
  const [t, tCari, tDays, tNav] = await Promise.all([
    getTranslations("Landing"),
    getTranslations("Cari"),
    getTranslations("Days"),
    getTranslations("Nav"),
  ]);
  const pasars = await getPasars();
  const searchAction = getPathname({ href: "/cari", locale });

  const days = (pasar: Pasar) =>
    WEEK.filter((day) => pasar.schedules.some((s) => s.dayOfWeek === day))
      .map((day) => tDays(`long.${day}`))
      .join(", ");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 pt-6 pb-12 lg:space-y-14 lg:px-6 lg:pt-12">
      {/* Greeting + search */}
      <section className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-5xl">
            {t("greeting")}
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground lg:text-lg">
            {t("intro")}
          </p>
        </div>
        <form
          role="search"
          action={searchAction}
          className="flex max-w-xl gap-2"
        >
          <label htmlFor="home-q" className="sr-only">
            {tCari("label")}
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="home-q"
              name="q"
              type="search"
              placeholder={tCari("placeholder")}
              className="h-12 w-full rounded-xl border bg-card pr-4 pl-12 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="h-12 rounded-xl px-5 font-semibold"
          >
            {t("searchButton")}
          </Button>
        </form>
      </section>

      {/* On tonight */}
      <section aria-labelledby="tonight" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="tonight" className="text-xl font-extrabold tracking-tight">
            {t("tonightTitle")}
          </h2>
          <Link
            href="/pasar"
            className="inline-flex h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-pasar-text outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t("seeMap")}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        <TonightPasars pasars={pasars} />
      </section>

      {/* The two sections */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/pasar"
          className="group rounded-2xl border-2 border-pasar bg-card p-5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-pasar text-on-pasar">
            <MapIcon className="size-5" aria-hidden />
          </span>
          <span className="mt-3 flex items-center gap-1 text-lg font-extrabold">
            {t("sectionPasarTitle")}
            <ChevronRight
              className="size-5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {t("sectionPasarBody", { count: pasars.length })}
          </span>
        </Link>
        <Link
          href="/kedai"
          className="group rounded-2xl border-2 border-kedai bg-card p-5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-kedai text-on-kedai">
            <Store className="size-5" aria-hidden />
          </span>
          <span className="mt-3 flex items-center gap-1 text-lg font-extrabold">
            {tNav("kedai")}
            <ChevronRight
              className="size-5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {t("sectionKedaiBody")}
          </span>
        </Link>
      </section>

      {/* Popular food */}
      <section aria-labelledby="food" className="space-y-3">
        <h2 id="food" className="text-xl font-extrabold tracking-tight">
          {t("foodTitle")}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {POPULAR_FOODS.map((food) => (
            <li key={food}>
              <Link
                href={{ pathname: "/cari", query: { q: food } }}
                className="inline-flex h-11 items-center rounded-full border bg-card px-4 text-sm font-semibold outline-none hover:border-pasar focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {food}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Pasar by area: server-rendered text for search engines */}
      <section aria-labelledby="areas" className="space-y-4">
        <h2 id="areas" className="text-xl font-extrabold tracking-tight">
          {t("areasTitle")}
        </h2>
        {groupByDistrict(pasars).map(([district, list]) => (
          <div key={district}>
            <h3 className="mb-2 text-sm font-bold text-muted-foreground">
              {district} · {t("areaCount", { count: list.length })}
            </h3>
            <ul className="grid gap-x-6 sm:grid-cols-2">
              {list.map((pasar) => (
                <li key={pasar.id} className="border-b">
                  <Link
                    href={{
                      pathname: "/pasar/[slug]",
                      params: { slug: pasar.slug },
                    }}
                    className="flex min-h-11 items-center justify-between gap-3 py-2 outline-none hover:text-pasar-text focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="font-semibold">{pasar.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {days(pasar)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Join */}
      <section className="rounded-2xl border bg-card p-6 lg:flex lg:items-center lg:justify-between lg:p-8">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {t("ctaTitle")}
          </h2>
          <p className="mt-1 text-muted-foreground">{t("ctaBody")}</p>
        </div>
        <Button
          asChild
          className="mt-4 h-12 rounded-xl bg-cta px-6 text-base font-bold text-on-cta hover:bg-cta/90 lg:mt-0"
        >
          <Link href="/akaun">{t("ctaButton")}</Link>
        </Button>
      </section>
    </div>
  );
}
