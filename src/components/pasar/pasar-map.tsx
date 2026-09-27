"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Point } from "geojson";
import {
  getVersion,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import Map, {
  AttributionControl,
  Layer,
  Marker,
  Source,
  type LayerProps,
  type MapRef,
} from "react-map-gl/maplibre";
import type { LatLng } from "@/lib/pasar/types";
import type { PasarView } from "./pasar-view";

// Served from /public by scripts/copy-maplibre-worker.mjs.
setWorkerUrl(`/vendor/maplibre-gl@${getVersion()}/maplibre-gl-worker.mjs`);

const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/fiord",
} as const;

const SOURCE_ID = "pasars";
const CLUSTER_LAYER = "pasar-clusters";
const POINT_LAYER = "pasar-points";
const FONT = ["Noto Sans Bold"];
const DESKTOP_QUERY = "(min-width: 1024px)";

export type MapFocus = { location: LatLng; zoom: number; key: number };

type PointProps = {
  id: string;
  name: string;
  status: string;
  selected: boolean;
};

/** Tracks the `dark` class next-themes puts on <html> (set after React renders). */
function subscribeHtmlClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const isDarkClass = () => document.documentElement.classList.contains("dark");

/** Palette tokens from globals.css, read at runtime so no hex lives here. */
function readColors() {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string) => style.getPropertyValue(name).trim();
  return {
    pasar: v("--pasar"),
    onPasar: v("--on-pasar"),
    open: v("--open"),
    closed: v("--text-muted"),
    card: v("--card"),
    text: v("--text"),
  };
}

/** On mobile the bottom sheet covers the lower half; keep the camera centred above it. */
function cameraPadding(container: HTMLElement) {
  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
  const base = 48;
  return {
    top: base,
    left: base,
    right: base,
    bottom: isDesktop ? base : Math.round(container.clientHeight * 0.5) + 24,
  };
}

export default function PasarMap({
  views,
  allLocations,
  selectedId,
  onSelect,
  focus,
  userLocation,
}: {
  views: PasarView[];
  allLocations: LatLng[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  focus: MapFocus | null;
  userLocation: LatLng | null;
}) {
  const t = useTranslations("Map");
  const isDark = useSyncExternalStore(
    subscribeHtmlClass,
    isDarkClass,
    () => false,
  );
  const theme = isDark ? "dark" : "light";
  const mapRef = useRef<MapRef>(null);

  // `theme` is a cache key: the values come from the <html> class, now already swapped.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const colors = useMemo(() => readColors(), [theme]);

  const data = useMemo<FeatureCollection<Point, PointProps>>(
    () => ({
      type: "FeatureCollection",
      features: views.map(({ pasar, status }) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [pasar.location.lng, pasar.location.lat],
        },
        properties: {
          id: pasar.id,
          name: pasar.name,
          status: status?.kind ?? "day",
          selected: pasar.id === selectedId,
        },
      })),
    }),
    [views, selectedId],
  );

  const layers = useMemo((): LayerProps[] => {
    return [
      {
        id: CLUSTER_LAYER,
        type: "circle",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": colors.pasar,
          "circle-radius": ["step", ["get", "point_count"], 18, 5, 22, 15, 28],
          "circle-stroke-width": 3,
          "circle-stroke-color": colors.card,
        },
      },
      {
        id: "pasar-cluster-count",
        type: "symbol",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": FONT,
          "text-size": 14,
          "text-allow-overlap": true,
        },
        paint: { "text-color": colors.onPasar },
      },
      {
        id: POINT_LAYER,
        type: "circle",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "status"],
            "open",
            colors.open,
            "closed",
            colors.closed,
            colors.pasar,
          ],
          "circle-radius": ["case", ["get", "selected"], 13, 10],
          "circle-stroke-width": ["case", ["get", "selected"], 4, 3],
          "circle-stroke-color": [
            "case",
            ["get", "selected"],
            colors.text,
            colors.card,
          ],
        },
      },
      {
        id: "pasar-labels",
        type: "symbol",
        filter: ["!", ["has", "point_count"]],
        minzoom: 11.5,
        layout: {
          "text-field": ["get", "name"],
          "text-font": FONT,
          "text-size": 12,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
          "text-max-width": 10,
          "text-optional": true,
        },
        paint: {
          "text-color": colors.text,
          "text-halo-color": colors.card,
          "text-halo-width": 1.5,
        },
      },
    ];
  }, [colors]);

  const initialBounds = useMemo(() => {
    const lats = allLocations.map((l) => l.lat);
    const lngs = allLocations.map((l) => l.lng);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ] as [[number, number], [number, number]];
  }, [allLocations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo({
      center: [focus.location.lng, focus.location.lat],
      zoom: Math.max(map.getZoom(), focus.zoom),
      padding: cameraPadding(map.getContainer()),
      duration: 900,
    });
  }, [focus]);

  async function handleClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    const map = mapRef.current;
    if (!feature || !map) return;

    if (feature.layer.id === CLUSTER_LAYER) {
      const source = map.getSource<GeoJSONSource>(SOURCE_ID);
      const zoom = await source?.getClusterExpansionZoom(
        Number(feature.properties.cluster_id),
      );
      if (zoom === undefined || feature.geometry.type !== "Point") return;
      const [lng, lat] = feature.geometry.coordinates;
      map.easeTo({
        center: [lng, lat],
        zoom,
        padding: cameraPadding(map.getContainer()),
      });
      return;
    }

    onSelect(String(feature.properties.id));
  }

  return (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLES[theme]}
      initialViewState={{ bounds: initialBounds }}
      onLoad={(e) => {
        const map = e.target;
        map.fitBounds(initialBounds, {
          padding: cameraPadding(map.getContainer()),
          duration: 0,
        });
      }}
      interactiveLayerIds={[CLUSTER_LAYER, POINT_LAYER]}
      onClick={handleClick}
      onMouseEnter={(e) => (e.target.getCanvas().style.cursor = "pointer")}
      onMouseLeave={(e) => (e.target.getCanvas().style.cursor = "")}
      attributionControl={false}
      dragRotate={false}
      touchPitch={false}
      style={{ width: "100%", height: "100%" }}
    >
      <AttributionControl position="top-right" compact />
      <Source
        id={SOURCE_ID}
        type="geojson"
        data={data}
        cluster
        clusterRadius={45}
        clusterMaxZoom={13}
      >
        {layers.map((layer) => (
          <Layer key={layer.id} {...layer} />
        ))}
      </Source>
      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
          <span
            role="img"
            aria-label={t("you")}
            className="block size-4 rounded-full border-3 border-card bg-foreground shadow-md"
          />
        </Marker>
      )}
    </Map>
  );
}
