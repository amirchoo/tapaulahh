"use client";

import { LocateFixed, LoaderCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PanelBody, PanelHeader, Placeholder } from "@/components/layout/panel";
import { SplitView } from "@/components/layout/split-view";
import { Button } from "@/components/ui/button";
import type { LatLng, Pasar } from "@/lib/pasar/types";
import { NEAR_ME_ZOOM, useUserLocation } from "./use-user-location";
import { DayChips, type DayFilter } from "./day-chips";
import type { MapFocus } from "./pasar-map";
import { PasarList } from "./pasar-list";
import { buildPasarViews } from "./pasar-view";
import { useMalaysiaNow } from "./use-malaysia-now";

// MapLibre needs the browser (WebGL), so it never renders on the server.
const PasarMap = dynamic(() => import("./pasar-map"), {
  ssr: false,
  loading: () => <div className="h-full bg-background" />,
});

/** Street level, close enough to see the pasar's own lanes. */
const PASAR_ZOOM = 17.5;

export function PasarExplorer({ pasars }: { pasars: Pasar[] }) {
  const t = useTranslations("PasarMap");
  const tMap = useTranslations("Map");
  const tDays = useTranslations("Days");
  const now = useMalaysiaNow();

  const [dayFilter, setDayFilter] = useState<DayFilter>("today");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const { userLocation, locating, locate } = useUserLocation((location) =>
    flyTo(location, NEAR_ME_ZOOM),
  );

  const isToday = dayFilter === "today" || dayFilter === now?.day;
  const day = dayFilter === "today" ? (now?.day ?? null) : dayFilter;

  const views = useMemo(
    () =>
      day === null
        ? []
        : buildPasarViews(pasars, day, now, isToday, userLocation),
    [pasars, day, now, isToday, userLocation],
  );

  function flyTo(location: LatLng, zoom: number) {
    setFocus((prev) => ({ location, zoom, key: (prev?.key ?? 0) + 1 }));
  }

  function selectPasar(id: string) {
    const pasar = pasars.find((p) => p.id === id);
    if (!pasar) return;
    setSelectedId(id);
    flyTo(pasar.location, PASAR_ZOOM);
    document
      .getElementById(`pasar-${id}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function changeDay(next: DayFilter) {
    setDayFilter(next);
    setSelectedId(null);
  }

  const emptyText =
    dayFilter === "today"
      ? t("empty")
      : t("emptyDay", { day: tDays(`long.${dayFilter}`) });

  return (
    <SplitView
      main={
        <section aria-label={tMap("label")} className="h-full">
          <PasarMap
            views={views}
            selectedId={selectedId}
            onSelect={selectPasar}
            focus={focus}
            userLocation={userLocation}
          />
        </section>
      }
      panel={
        <>
          <div className="flex items-start justify-between gap-3 pr-2 lg:pr-4">
            <PanelHeader title={t("title")} subtitle={t("subtitle")} />
            <Button
              variant="outline"
              onClick={locate}
              disabled={locating === "locating"}
              className="mt-4 h-11 shrink-0 gap-2 px-4 font-semibold lg:mt-6"
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
            <DayChips value={dayFilter} onChange={changeDay} />
            <p
              role="status"
              className="mt-2 min-h-5 text-sm text-muted-foreground"
            >
              {locating === "locating"
                ? tMap("locating")
                : locating === "denied"
                  ? tMap("locationDenied")
                  : locating === "outside"
                    ? tMap("outsideMalaysia")
                    : day !== null && views.length > 0
                      ? t("count", { count: views.length })
                      : ""}
            </p>
            <div className="mt-2">
              {day === null ? (
                <Placeholder>{t("loading")}</Placeholder>
              ) : views.length === 0 ? (
                <Placeholder>{emptyText}</Placeholder>
              ) : (
                <PasarList
                  views={views}
                  selectedId={selectedId}
                  onSelect={selectPasar}
                />
              )}
            </div>
          </PanelBody>
        </>
      }
    />
  );
}
