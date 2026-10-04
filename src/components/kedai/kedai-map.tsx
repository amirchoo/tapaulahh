"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Point } from "geojson";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  MapLayerMouseEvent,
} from "maplibre-gl";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import Map, {
  AttributionControl,
  Layer,
  Marker,
  Source,
  type LayerProps,
  type MapRef,
} from "react-map-gl/maplibre";
import {
  aliasMissingIcons,
  cameraPadding,
  isDarkClass,
  MAP_STYLES,
  START_BOUNDS,
  subscribeHtmlClass,
} from "@/components/pasar/map-style";
import type { Business } from "@/lib/kedai/types";
import type { LatLng } from "@/lib/pasar/types";

const SOURCE_ID = "businesses";
const CLUSTER_LAYER = "business-clusters";
const AREA_LAYER = "business-areas";
const FONT = ["Noto Sans Bold"];

/** Never zoom closer than this: the circle is an area, not an address. */
export const AREA_MAX_ZOOM = 14.5;

/**
 * Circle radius for ~500 m on the ground, in screen pixels, at Klang Valley
 * latitudes (metres per pixel halve with each zoom level). Below zoom 11.5 it
 * stays at ~9px so lone businesses remain tappable. (MapLibre only allows
 * ["zoom"] as the input of a top-level interpolate, so the minimum lives here.)
 */
const AREA_RADIUS: ExpressionSpecification = [
  "interpolate",
  ["exponential", 2],
  ["zoom"],
  11.5,
  9.3,
  20,
  3354,
];

export type MapFocus = { location: LatLng; zoom: number; key: number };

/** Palette tokens from globals.css, read at runtime so no hex lives here. */
function readColors() {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string) => style.getPropertyValue(name).trim();
  return {
    kedai: v("--kedai"),
    onKedai: v("--on-kedai"),
    card: v("--card"),
    text: v("--text"),
  };
}

export default function KedaiMap({
  businesses,
  selectedId,
  onSelect,
  focus,
  userLocation,
}: {
  businesses: Business[];
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
  const mapRef = useRef<MapRef | null>(null);

  const setMapRef = useCallback((ref: MapRef | null) => {
    mapRef.current = ref;
    if (ref) aliasMissingIcons(ref.getMap());
  }, []);

  // `theme` is a cache key: the values come from the <html> class, now already swapped.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const colors = useMemo(() => readColors(), [theme]);

  const data = useMemo<
    FeatureCollection<Point, { id: string; name: string; selected: boolean }>
  >(
    () => ({
      type: "FeatureCollection",
      features: businesses.flatMap((b) =>
        b.area
          ? [
              {
                type: "Feature" as const,
                geometry: {
                  type: "Point" as const,
                  coordinates: [b.area.lng, b.area.lat],
                },
                properties: {
                  id: b.id,
                  name: b.name,
                  selected: b.id === selectedId,
                },
              },
            ]
          : [],
      ),
    }),
    [businesses, selectedId],
  );

  const layers = useMemo(
    (): LayerProps[] => [
      {
        id: CLUSTER_LAYER,
        type: "circle",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": colors.kedai,
          "circle-radius": ["step", ["get", "point_count"], 18, 5, 22, 15, 28],
          "circle-stroke-width": 3,
          "circle-stroke-color": colors.card,
        },
      },
      {
        id: "business-cluster-count",
        type: "symbol",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": FONT,
          "text-size": 14,
          "text-allow-overlap": true,
        },
        paint: { "text-color": colors.onKedai },
      },
      {
        // A soft circle over the area, deliberately without a centre dot.
        id: AREA_LAYER,
        type: "circle",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": colors.kedai,
          "circle-opacity": ["case", ["get", "selected"], 0.4, 0.2],
          "circle-radius": AREA_RADIUS,
          "circle-stroke-width": ["case", ["get", "selected"], 3, 1.5],
          "circle-stroke-color": colors.kedai,
        },
      },
      {
        id: "business-labels",
        type: "symbol",
        filter: ["!", ["has", "point_count"]],
        minzoom: 11.5,
        layout: {
          "text-field": ["get", "name"],
          "text-font": FONT,
          "text-size": 12,
          "text-max-width": 10,
          "text-optional": true,
        },
        paint: {
          "text-color": colors.text,
          "text-halo-color": colors.card,
          "text-halo-width": 1.5,
        },
      },
    ],
    [colors],
  );

  // A tap that arrives before the map has loaded is applied in onLoad.
  const pendingFocus = useRef(focus);
  useEffect(() => {
    pendingFocus.current = focus;
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo({
      center: [focus.location.lng, focus.location.lat],
      zoom: focus.zoom,
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
        zoom: Math.min(zoom, AREA_MAX_ZOOM),
        padding: cameraPadding(map.getContainer()),
      });
      return;
    }

    onSelect(String(feature.properties.id));
  }

  return (
    <Map
      ref={setMapRef}
      mapStyle={MAP_STYLES[theme]}
      initialViewState={{ bounds: START_BOUNDS }}
      onLoad={(e) => {
        const map = e.target;
        const pending = pendingFocus.current;
        if (pending) {
          map.jumpTo({
            center: [pending.location.lng, pending.location.lat],
            zoom: pending.zoom,
            padding: cameraPadding(map.getContainer()),
          });
          return;
        }
        map.fitBounds(START_BOUNDS, {
          padding: cameraPadding(map.getContainer()),
          duration: 0,
        });
      }}
      maxZoom={16}
      interactiveLayerIds={[CLUSTER_LAYER, AREA_LAYER]}
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
        clusterMaxZoom={12}
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
