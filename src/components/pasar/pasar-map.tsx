"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Point } from "geojson";
import type { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
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
import type { LatLng } from "@/lib/pasar/types";
import {
  aliasMissingIcons,
  cameraPadding,
  isDarkClass,
  MAP_STYLES,
  START_BOUNDS,
  subscribeHtmlClass,
} from "./map-style";
import type { PasarView } from "./pasar-view";

const SOURCE_ID = "pasars";
const CLUSTER_LAYER = "pasar-clusters";
const POINT_LAYER = "pasar-points";
const FONT = ["Noto Sans Bold"];

export type MapFocus = { location: LatLng; zoom: number; key: number };

type PointProps = {
  id: string;
  name: string;
  status: string;
  selected: boolean;
};

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

export default function PasarMap({
  views,
  selectedId,
  onSelect,
  focus,
  userLocation,
}: {
  views: PasarView[];
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

  // react-map-gl creates the map asynchronously; this runs once it exists.
  const setMapRef = useCallback((ref: MapRef | null) => {
    mapRef.current = ref;
    if (ref) aliasMissingIcons(ref.getMap());
  }, []);

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

  // A tap that arrives before the map has loaded is applied in onLoad.
  const pendingFocus = useRef(focus);
  useEffect(() => {
    pendingFocus.current = focus;
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
