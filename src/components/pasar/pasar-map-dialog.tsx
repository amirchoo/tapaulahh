"use client";

import { ArrowLeft, ArrowUpRight, LoaderCircle, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { directionsUrl } from "@/lib/pasar/directions";
import type { LatLng } from "@/lib/pasar/types";
import { DayChips, type DayFilter } from "./day-chips";
import { StatusLine } from "./pasar-list";
import type { MapCamera, MapFocus } from "./pasar-map";
import type { PasarView } from "./pasar-view";

// Mounted only inside an open dialog: list browsing does not load WebGL or tiles.
const PasarMap = dynamic(() => import("./pasar-map"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const t = useTranslations("PasarMap");
  return (
    <div
      role="status"
      className="flex h-full items-center justify-center gap-2 bg-background p-4 text-sm text-muted-foreground"
    >
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      {t("mapLoading")}
    </div>
  );
}

class MapBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function PasarMapDialog({
  open,
  onOpenChange,
  views,
  selected,
  onSelect,
  focus,
  initialCamera,
  onCameraChange,
  dayFilter,
  onDayChange,
  dayLabel,
  emptyText,
  userLocation,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  views: PasarView[];
  selected: PasarView | null;
  onSelect: (id: string) => void;
  focus: MapFocus | null;
  initialCamera: MapCamera | null;
  onCameraChange: (camera: MapCamera) => void;
  dayFilter: DayFilter;
  onDayChange: (day: DayFilter) => void;
  dayLabel: string;
  emptyText: string;
  userLocation: LatLng | null;
  onCloseAutoFocus: (event: Event) => void;
}) {
  const t = useTranslations("PasarMap");
  const tMap = useTranslations("Map");
  const tPasar = useTranslations("Pasar");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-card text-card-foreground outline-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[85dvh] lg:max-h-[900px] lg:w-[90vw] lg:max-w-6xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:border lg:shadow-xl [@media(max-height:500px)]:inset-0 [@media(max-height:500px)]:h-dvh [@media(max-height:500px)]:max-h-none [@media(max-height:500px)]:w-full [@media(max-height:500px)]:max-w-none [@media(max-height:500px)]:translate-none"
        >
          <div className="shrink-0 border-b px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 lg:px-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <Dialog.Title className="text-xl font-extrabold tracking-tight">
                  {tMap("label")}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {dayLabel} · {t("count", { count: views.length })}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="outline" className="h-11 gap-2 px-3">
                  <ArrowLeft className="size-4" aria-hidden />
                  {t("backToList")}
                </Button>
              </Dialog.Close>
            </div>
            <div className="min-w-0 overflow-hidden">
              <DayChips value={dayFilter} onChange={onDayChange} />
            </div>
          </div>
          <div className="relative min-h-24 flex-1" aria-label={tMap("label")}>
            {views.length ? (
              <MapBoundary
                fallback={
                  <div
                    role="alert"
                    className="flex h-full items-center justify-center p-6 text-center text-muted-foreground"
                  >
                    {t("mapError")}
                  </div>
                }
              >
                <PasarMap
                  views={views}
                  selectedId={selected?.pasar.id ?? null}
                  onSelect={onSelect}
                  focus={focus}
                  userLocation={userLocation}
                  initialCamera={initialCamera}
                  onCameraChange={onCameraChange}
                />
              </MapBoundary>
            ) : (
              <p
                role="status"
                className="flex h-full items-center justify-center p-6 text-center text-muted-foreground"
              >
                {emptyText}
              </p>
            )}
          </div>
          {views.length > 0 && (
            <div className="max-h-[35dvh] shrink-0 overflow-y-auto overscroll-contain border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6">
              {selected ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="min-w-0 flex-1 basis-52 break-words"
                    aria-live="polite"
                  >
                    <h2 className="text-lg font-bold">{selected.pasar.name}</h2>
                    <StatusLine view={selected} />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selected.pasar.address ||
                        `${selected.pasar.district}, ${selected.pasar.state}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 gap-2 px-3"
                    >
                      <a
                        href={directionsUrl(selected.pasar.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="size-4" aria-hidden />
                        {tPasar("directions")}
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 gap-2 border-pasar px-3 text-pasar-text"
                    >
                      <Link
                        href={{
                          pathname: "/pasar/[slug]",
                          params: { slug: selected.pasar.slug },
                        }}
                      >
                        {t("viewPasar")}
                        <ArrowUpRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("selectPin")}
                </p>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
