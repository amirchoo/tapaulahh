"use client";

import { ArrowLeft, MapPin, Navigation } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { Component, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { directionsUrl } from "@/lib/pasar/directions";
import type { LatLng } from "@/lib/pasar/types";
import { PasarSpotMapLazy } from "./pasar-spot-map-lazy";
import { usePasarMapHistory } from "./use-pasar-map-history";

class LocationMapBoundary extends Component<
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

/** A market location, separate from a future map of precise stall positions. */
export function PasarLocationDialog({
  location,
  name,
  address,
  backLabel,
}: {
  location: LatLng;
  name: string;
  address: string;
  backLabel: string;
}) {
  const t = useTranslations("Pasar");
  const { open, setOpen } = usePasarMapHistory();
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button ref={trigger} variant="outline" className="h-11 gap-2 px-4">
          <MapPin className="size-4" aria-hidden />
          {t("showLocation")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus({ preventScroll: true });
          }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-card text-card-foreground outline-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[80dvh] lg:max-h-[900px] lg:w-[85vw] lg:max-w-5xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:border lg:shadow-xl [@media(max-height:500px)]:inset-0 [@media(max-height:500px)]:h-dvh [@media(max-height:500px)]:max-h-none [@media(max-height:500px)]:w-full [@media(max-height:500px)]:max-w-none [@media(max-height:500px)]:translate-none"
        >
          <div className="flex max-h-[35dvh] shrink-0 flex-wrap items-start justify-between gap-3 overflow-y-auto border-b px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 lg:px-6">
            <div className="min-w-0 flex-1 basis-48 break-words">
              <Dialog.Title className="text-lg font-extrabold">
                {t("location")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {name}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="outline" className="h-11 gap-2 px-3">
                <ArrowLeft className="size-4" aria-hidden />
                {backLabel}
              </Button>
            </Dialog.Close>
          </div>
          <div className="relative min-h-24 flex-1">
            <LocationMapBoundary
              fallback={
                <p
                  role="alert"
                  className="flex h-full items-center justify-center p-6 text-center text-muted-foreground"
                >
                  {t("locationMapError")}
                </p>
              }
            >
              <PasarSpotMapLazy location={location} label={name} />
            </LocationMapBoundary>
          </div>
          <div className="max-h-[35dvh] shrink-0 space-y-3 overflow-y-auto border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6">
            <p className="text-sm text-muted-foreground">{address || name}</p>
            <Button asChild variant="outline" className="h-11 gap-2 px-4">
              <a
                href={directionsUrl(location)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-4" aria-hidden />
                {t("directions")}
              </a>
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
