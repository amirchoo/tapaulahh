"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { LoaderCircle, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Map, {
  AttributionControl,
  Marker,
  type MapRef,
} from "react-map-gl/maplibre";
import type { LatLng } from "@/lib/pasar/types";
import {
  aliasMissingIcons,
  isDarkClass,
  MAP_STYLES,
  subscribeHtmlClass,
} from "./map-style";

/** One pasar's pin, for the pasar and stall pages. Loaded with ssr: false. */
export default function PasarSpotMap({
  location,
  label,
}: {
  location: LatLng;
  label: string;
}) {
  const t = useTranslations("Pasar");
  const tMap = useTranslations("PasarMap");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const isDark = useSyncExternalStore(
    subscribeHtmlClass,
    isDarkClass,
    () => false,
  );
  const setMapRef = useCallback((ref: MapRef | null) => {
    resizeObserver.current?.disconnect();
    if (ref) {
      aliasMissingIcons(ref.getMap());
      resizeObserver.current = new ResizeObserver(() => ref.resize());
      resizeObserver.current.observe(ref.getContainer());
    }
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setFailed(true), 20_000);
    return () => window.clearTimeout(timeout);
  }, [loading]);

  return (
    <div className="relative h-full">
      <Map
        ref={setMapRef}
        mapStyle={MAP_STYLES[isDark ? "dark" : "light"]}
        initialViewState={{
          longitude: location.lng,
          latitude: location.lat,
          zoom: 17.5,
        }}
        onLoad={(e) => {
          e.target.resize();
          setLoading(false);
          setFailed(false);
        }}
        onError={() => setFailed(true)}
        onIdle={(event) => {
          if (event.target.isStyleLoaded()) setFailed(false);
        }}
        attributionControl={false}
        dragRotate={false}
        touchPitch={false}
        style={{ width: "100%", height: "100%" }}
      >
        <AttributionControl position="top-right" compact />
        <Marker
          longitude={location.lng}
          latitude={location.lat}
          anchor="bottom"
        >
          <span role="img" aria-label={label} className="block">
            <MapPin
              className="size-10 fill-pasar text-on-pasar"
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
        </Marker>
      </Map>
      {(loading || failed) && (
        <div
          role={failed ? "alert" : "status"}
          className="absolute inset-0 flex items-center justify-center gap-2 bg-background p-6 text-center text-sm text-muted-foreground"
        >
          {failed ? (
            t("locationMapError")
          ) : (
            <>
              <LoaderCircle
                className="size-5 shrink-0 animate-spin"
                aria-hidden
              />
              {tMap("mapLoading")}
            </>
          )}
        </div>
      )}
    </div>
  );
}
