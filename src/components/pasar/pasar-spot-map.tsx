"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
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

const DESKTOP_QUERY = "(min-width: 1024px)";

/** One pasar's pin, for the pasar and stall pages. Loaded with ssr: false. */
export default function PasarSpotMap({
  location,
  label,
}: {
  location: LatLng;
  label: string;
}) {
  const isDark = useSyncExternalStore(
    subscribeHtmlClass,
    isDarkClass,
    () => false,
  );
  const setMapRef = useCallback((ref: MapRef | null) => {
    if (ref) aliasMissingIcons(ref.getMap());
  }, []);

  return (
    <Map
      ref={setMapRef}
      mapStyle={MAP_STYLES[isDark ? "dark" : "light"]}
      initialViewState={{
        longitude: location.lng,
        latitude: location.lat,
        zoom: 17.5,
      }}
      onLoad={(e) => {
        // On phones the bottom sheet covers the lower half: show the pin above it.
        const map = e.target;
        if (window.matchMedia(DESKTOP_QUERY).matches) return;
        map.easeTo({
          center: [location.lng, location.lat],
          padding: {
            bottom: Math.round(map.getContainer().clientHeight * 0.5),
          },
          duration: 0,
        });
      }}
      attributionControl={false}
      dragRotate={false}
      touchPitch={false}
      style={{ width: "100%", height: "100%" }}
    >
      <AttributionControl position="top-right" compact />
      <Marker longitude={location.lng} latitude={location.lat} anchor="bottom">
        <span role="img" aria-label={label} className="block drop-shadow-md">
          <MapPin
            className="size-10 fill-pasar text-on-pasar"
            strokeWidth={1.5}
            aria-hidden
          />
        </span>
      </Marker>
    </Map>
  );
}
