"use client";

import {
  ChevronRight,
  Info,
  LoaderCircle,
  LocateFixed,
  Store,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PanelBody, PanelHeader } from "@/components/layout/panel";
import { SplitView } from "@/components/layout/split-view";
import { formatKm } from "@/components/pasar/format";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Business, BusinessCategory } from "@/lib/kedai/types";
import { distanceMetres } from "@/lib/pasar/schedule";
import type { LatLng } from "@/lib/pasar/types";
import { cn } from "@/lib/utils";
import { AREA_MAX_ZOOM, type MapFocus } from "./kedai-map";

// MapLibre needs the browser (WebGL), so it never renders on the server.
const KedaiMap = dynamic(() => import("./kedai-map"), {
  ssr: false,
  loading: () => <div className="h-full bg-background" />,
});

type Locating = "idle" | "locating" | "denied";

export function KedaiExplorer({
  businesses,
  signUpHref,
}: {
  businesses: Business[];
  /** Localized /daftar?next=/akaun/kedai, for the empty state. */
  signUpHref: string;
}) {
  const t = useTranslations("Kedai");
  const tMap = useTranslations("Map");
  const locale = useLocale();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState<Locating>("idle");

  // Only categories that have at least one business, in their own order.
  const categories = useMemo(() => {
    const byId = new Map<string, BusinessCategory>();
    for (const b of businesses)
      if (b.category) byId.set(b.category.id, b.category);
    return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [businesses]);

  const shown = useMemo(() => {
    const list = businesses
      .filter((b) => !categoryId || b.category?.id === categoryId)
      .map((b) => ({
        business: b,
        distance:
          userLocation && b.area ? distanceMetres(userLocation, b.area) : null,
      }));
    if (userLocation) {
      list.sort(
        (a, b) =>
          (a.distance ?? Infinity) - (b.distance ?? Infinity) ||
          a.business.name.localeCompare(b.business.name),
      );
    }
    return list;
  }, [businesses, categoryId, userLocation]);

  function flyTo(location: LatLng, zoom: number) {
    setFocus((prev) => ({ location, zoom, key: (prev?.key ?? 0) + 1 }));
  }

  function select(id: string) {
    const business = businesses.find((b) => b.id === id);
    setSelectedId(id);
    if (business?.area) flyTo(business.area, AREA_MAX_ZOOM);
    document
      .getElementById(`business-${id}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setLocating("denied");
      return;
    }
    setLocating("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(location);
        setLocating("idle");
        flyTo(location, 12.5);
      },
      () => setLocating("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  const categoryName = (c: BusinessCategory) =>
    locale === "en" ? c.nameEn : c.nameMs;

  return (
    <SplitView
      main={
        <section aria-label={t("mapLabel")} className="relative h-full">
          <KedaiMap
            businesses={businesses}
            selectedId={selectedId}
            onSelect={select}
            focus={focus}
            userLocation={userLocation}
          />
          <p className="pointer-events-none absolute top-12 left-3 flex max-w-[70%] items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold shadow">
            <Info className="size-3.5 shrink-0 text-kedai" aria-hidden />
            {t("mapNote")}
          </p>
        </section>
      }
      panel={
        <>
          <div className="flex items-start justify-between gap-3 pr-2 lg:pr-4">
            <PanelHeader
              section="kedai"
              title={t("title")}
              subtitle={t("subtitle")}
            />
            <Button
              variant="outline"
              onClick={locate}
              disabled={locating === "locating"}
              className="mt-4 h-11 shrink-0 gap-2 rounded-full px-4 font-semibold lg:mt-6"
            >
              {locating === "locating" ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <LocateFixed className="size-4" aria-hidden />
              )}
              {tMap("nearMe")}
            </Button>
          </div>
          <PanelBody>
            {categories.length > 1 && (
              <div
                role="group"
                aria-label={t("categoryFilter")}
                className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 lg:-mx-6 lg:px-6"
              >
                {[null, ...categories].map((c) => {
                  const active = (c?.id ?? null) === categoryId;
                  return (
                    <button
                      key={c?.id ?? "all"}
                      type="button"
                      onClick={() => {
                        setCategoryId(c?.id ?? null);
                        setSelectedId(null);
                      }}
                      aria-pressed={active}
                      className={cn(
                        "h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        active
                          ? "border-kedai bg-kedai font-bold text-on-kedai"
                          : "bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {c ? categoryName(c) : t("all")}
                    </button>
                  );
                })}
              </div>
            )}
            <p
              role="status"
              className="mt-2 min-h-5 text-sm text-muted-foreground"
            >
              {locating === "locating"
                ? tMap("locating")
                : locating === "denied"
                  ? tMap("locationDenied")
                  : shown.length > 0
                    ? t("count", { count: shown.length })
                    : ""}
            </p>

            {businesses.length === 0 ? (
              <div className="mt-2 space-y-3 rounded-xl border border-dashed p-4">
                <p className="text-sm text-muted-foreground">{t("empty")}</p>
                <Button
                  asChild
                  className="h-11 rounded-xl bg-cta px-4 font-bold text-on-cta hover:bg-cta/90"
                >
                  <a href={signUpHref}>{t("emptyCta")}</a>
                </Button>
              </div>
            ) : (
              <ul className="mt-2 space-y-2">
                {shown.map(({ business: b, distance }) => (
                  <li
                    key={b.id}
                    id={`business-${b.id}`}
                    className={cn(
                      "scroll-my-3 rounded-xl border bg-card transition-colors",
                      b.id === selectedId && "border-kedai ring-1 ring-kedai",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => select(b.id)}
                      aria-pressed={b.id === selectedId}
                      className="flex w-full gap-3 rounded-t-xl px-4 pt-3 pb-2 text-left outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-kedai/15 text-kedai">
                        {b.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={b.logoUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Store className="size-6" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-bold">{b.name}</span>
                          {distance !== null && (
                            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                              {tMap("away", {
                                distance: formatKm(distance, locale),
                              })}
                            </span>
                          )}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {[b.category && categoryName(b.category), b.district]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        {b.description && (
                          <span className="mt-0.5 line-clamp-1 block text-sm">
                            {b.description}
                          </span>
                        )}
                      </span>
                    </button>
                    <Link
                      href={{
                        pathname: "/kedai/[slug]",
                        params: { slug: b.slug },
                      }}
                      className="flex h-11 items-center justify-between rounded-b-xl border-t px-4 text-sm font-semibold text-kedai outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {t("viewShop")}
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </>
      }
    />
  );
}
