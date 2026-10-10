import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { TonightPasars } from "@/components/home/tonight-pasars";
import { Button } from "@/components/ui/button";
import { getPathname, Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/server";
import { POPULAR_FOODS } from "@/lib/pasar/popular-foods";
import { getPasars } from "@/lib/pasar/queries";
import { WEEK } from "@/lib/pasar/schedule";
import type { Pasar } from "@/lib/pasar/types";

// Pasar data comes from Supabase; rebuild the page at most every 5 minutes.
export const revalidate = 300;

/** Area list order: by district, then name. */
function byArea(pasars: Pasar[]): Pasar[] {
  return [...pasars].sort(
    (a, b) =>
      a.district.localeCompare(b.district) ||
      a.name.localeCompare(b.name, undefined, { numeric: true }),
  );
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

  // "Setiap hari", or short names with runs of 3+ days collapsed ("Isn–Kha, Sab")
  const days = (pasar: Pasar) => {
    const on = WEEK.map((day) =>
      pasar.schedules.some((s) => s.dayOfWeek === day),
    );
    if (on.every(Boolean)) return tDays("everyDay");
    const parts: string[] = [];
    for (let i = 0; i < WEEK.length; i++) {
      if (!on[i]) continue;
      let end = i;
      while (end + 1 < WEEK.length && on[end + 1]) end++;
      const first = tDays(`short.${WEEK[i]}`);
      const last = tDays(`short.${WEEK[end]}`);
      if (end - i >= 2) parts.push(`${first}–${last}`);
      else for (let j = i; j <= end; j++) parts.push(tDays(`short.${WEEK[j]}`));
      i = end;
    }
    return parts.join(", ");
  };

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
              className="h-12 w-full border bg-card pr-4 pl-12 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="h-12 px-5 font-semibold"
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
            className="inline-flex h-11 items-center gap-1 px-2 text-sm font-semibold text-pasar-text outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t("seeMap")}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        <TonightPasars pasars={pasars} />
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
                className="inline-flex h-11 items-center border bg-card px-4 text-sm font-semibold outline-none hover:border-pasar focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {food}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Peniaga Kecil */}
      <Link
        href="/kedai"
        className="group flex items-center justify-between gap-4 bg-kedai p-5 text-on-kedai outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:p-8"
      >
        <span>
          <span className="block text-2xl font-extrabold tracking-tight lg:text-3xl">
            {tNav("kedai")}
          </span>
          <span className="mt-1 block max-w-xl">{t("kedaiBody")}</span>
        </span>
        <ChevronRight
          className="size-7 shrink-0 transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </Link>

      {/* Pasar by area: server-rendered links for search engines, collapsed for people */}
      {pasars.length > 0 && (
        <details className="group border-t">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
            <h2 className="text-xl font-extrabold tracking-tight">
              {t("areasTitle", { count: pasars.length })}
            </h2>
            <ChevronDown
              className="size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <ul className="grid gap-x-6 pb-2 sm:grid-cols-2">
            {byArea(pasars).map((pasar) => (
              <li key={pasar.id} className="border-b">
                <Link
                  href={{
                    pathname: "/pasar/[slug]",
                    params: { slug: pasar.slug },
                  }}
                  className="block min-h-11 py-2.5 outline-none hover:text-pasar-text focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="block font-semibold">{pasar.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {pasar.district} · {days(pasar)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Join */}
      <section className="border bg-card p-6 lg:flex lg:items-center lg:justify-between lg:p-8">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {t("ctaTitle")}
          </h2>
          <p className="mt-1 text-muted-foreground">{t("ctaBody")}</p>
        </div>
        <Button
          asChild
          className="mt-4 h-12 bg-cta px-6 text-base font-bold text-on-cta hover:bg-cta/90 lg:mt-0"
        >
          <Link
            href={{
              pathname: "/daftar",
              query: { next: getPathname({ href: "/akaun/kedai", locale }) },
            }}
          >
            {t("ctaButton")}
          </Link>
        </Button>
      </section>
    </div>
  );
}
