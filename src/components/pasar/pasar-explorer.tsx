"use client";

import { LocateFixed, LoaderCircle, Map } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { Placeholder } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import type { Pasar } from "@/lib/pasar/types";
import { DayChips, type DayFilter } from "./day-chips";
import type { MapCamera, MapFocus } from "./pasar-map";
import { PasarMapDialog } from "./pasar-map-dialog";
import { PasarList } from "./pasar-list";
import { buildPasarViews } from "./pasar-view";
import { useMalaysiaNow } from "./use-malaysia-now";
import { useUserLocation } from "./use-user-location";
import { usePasarMapHistory } from "./use-pasar-map-history";

export function PasarExplorer({ pasars }: { pasars: Pasar[] }) {
  const t = useTranslations("PasarMap");
  const tMap = useTranslations("Map");
  const tDays = useTranslations("Days");
  const now = useMalaysiaNow();
  const { open, setOpen } = usePasarMapHistory();
  const [dayFilter, setDayFilter] = useState<DayFilter>("today");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [camera, setCamera] = useState<MapCamera | null>(null);
  // Asked on load too; with a location the list is sorted by distance.
  const { userLocation, locating, locate } = useUserLocation(() => {});
  const opener = useRef<HTMLButtonElement | null>(null);
  const mapButton = useRef<HTMLButtonElement | null>(null);
  const heading = useRef<HTMLHeadingElement | null>(null);

  const isToday = dayFilter === "today" || dayFilter === now?.day;
  const day = dayFilter === "today" ? (now?.day ?? null) : dayFilter;
  const views = useMemo(
    () =>
      day === null
        ? []
        : buildPasarViews(pasars, day, now, isToday, userLocation),
    [pasars, day, now, isToday, userLocation],
  );
  const selected = views.find((view) => view.pasar.id === selectedId) ?? null;
  const dayLabel =
    dayFilter === "today" ? t("today") : tDays(`long.${dayFilter}`);
  const emptyText =
    dayFilter === "today" ? t("empty") : t("emptyDay", { day: dayLabel });

  function selectPasar(id: string) {
    const view = views.find((view) => view.pasar.id === id);
    if (!view) return;
    setSelectedId(id);
    setFocus((previous) => ({
      location: view.pasar.location,
      zoom: 15,
      key: (previous?.key ?? 0) + 1,
    }));
  }

  function showMap(button: HTMLButtonElement, id?: string) {
    opener.current = button;
    if (id) {
      setCamera(null);
      selectPasar(id);
    } else {
      setFocus(null);
    }
    setOpen(true);
  }

  function changeDay(next: DayFilter) {
    setDayFilter(next);
    setSelectedId(null);
    setFocus(null);
    setCamera(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-10 lg:px-6 lg:pt-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-3xl font-extrabold tracking-tight lg:text-4xl"
          >
            {t("title")}
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>
      <div className="sticky top-0 z-10 -mx-4 border-b bg-background px-4 pt-3 pb-3 lg:-mx-6 lg:px-6 [@media(max-height:500px)]:static">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-full min-w-0 flex-1 basis-full overflow-hidden lg:basis-64">
            <DayChips value={dayFilter} onChange={changeDay} />
          </div>
          <div className="order-first flex flex-wrap gap-2 lg:order-last">
            <Button
              variant="outline"
              onClick={locate}
              disabled={locating === "locating"}
              className="h-11 gap-2 px-4 font-semibold"
            >
              {locating === "locating" ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <LocateFixed className="size-4" aria-hidden />
              )}
              {tMap("nearMe")}
            </Button>
            <Button
              ref={mapButton}
              variant="outline"
              onClick={(event) => showMap(event.currentTarget)}
              disabled={views.length === 0}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-describedby={
                views.length === 0 ? "pasar-results" : undefined
              }
              className="h-11 gap-2 border-pasar px-4 font-semibold text-pasar-text"
            >
              <Map className="size-4" aria-hidden />
              {t("showMap")}
            </Button>
          </div>
        </div>
      </div>
      <p
        id="pasar-results"
        role="status"
        className="mt-4 mb-4 text-sm text-muted-foreground"
      >
        {locating === "locating"
          ? tMap("locating")
          : locating === "denied"
            ? t("locationDenied")
            : locating === "outside"
              ? t("outsideMalaysia")
              : day === null
                ? t("loading")
                : t("count", { count: views.length })}
      </p>
      {day === null ? (
        <Placeholder>{t("loading")}</Placeholder>
      ) : views.length === 0 ? (
        <Placeholder>{emptyText}</Placeholder>
      ) : (
        <PasarList
          views={views}
          onShowMap={(id, button) => showMap(button, id)}
        />
      )}
      <PasarMapDialog
        open={open}
        onOpenChange={setOpen}
        views={views}
        selected={selected}
        onSelect={selectPasar}
        focus={selected ? focus : null}
        initialCamera={camera}
        onCameraChange={setCamera}
        dayFilter={dayFilter}
        onDayChange={changeDay}
        dayLabel={dayLabel}
        emptyText={day === null ? t("loading") : emptyText}
        userLocation={userLocation}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target =
            opener.current?.isConnected && !opener.current.disabled
              ? opener.current
              : mapButton.current && !mapButton.current.disabled
                ? mapButton.current
                : heading.current;
          target?.focus({ preventScroll: true });
        }}
      />
    </div>
  );
}
