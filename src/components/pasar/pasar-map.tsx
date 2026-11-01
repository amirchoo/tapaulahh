"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { LoaderCircle } from "lucide-react";
import type { FeatureCollection, Point } from "geojson";
import type { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
export type MapCamera = { longitude: number; latitude: number; zoom: number };

const padding = { top: 48, right: 48, bottom: 48, left: 48 };

function resultBounds(points: string): [[number, number], [number, number]] {
  const coordinates = JSON.parse(points) as [number, number][];
  if (!coordinates.length) return START_BOUNDS;
  return [
    [
      Math.min(...coordinates.map(([lng]) => lng)),
      Math.min(...coordinates.map(([, lat]) => lat)),
    ],
    [
      Math.max(...coordinates.map(([lng]) => lng)),
      Math.max(...coordinates.map(([, lat]) => lat)),
    ],
  ];
}

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
  initialCamera,
  onCameraChange,
}: {
  views: PasarView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  focus: MapFocus | null;
  userLocation: LatLng | null;
  initialCamera: MapCamera | null;
  onCameraChange: (camera: MapCamera) => void;
}) {
  const t = useTranslations("Map");
  const tPasar = useTranslations("PasarMap");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const isDark = useSyncExternalStore(
    subscribeHtmlClass,
    isDarkClass,
    () => false,
  );
  const theme = isDark ? "dark" : "light";
  const mapRef = useRef<MapRef | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const lastCommand = useRef("");
  const points = JSON.stringify(
    views
      .map(({ pasar }) => [pasar.location.lng, pasar.location.lat])
      .sort(([a], [b]) => a - b),
  );
  const bounds = useMemo(() => resultBounds(points), [points]);
  const command = `${points}:${focus ? `${focus.location.lng},${focus.location.lat},${focus.key}` : "all"}`;

  // react-map-gl creates the map asynchronously; this runs once it exists.
  const setMapRef = useCallback((ref: MapRef | null) => {
    resizeObserver.current?.disconnect();
    mapRef.current = ref;
    if (ref) {
      aliasMissingIcons(ref.getMap());
      resizeObserver.current = new ResizeObserver(() => ref.resize());
      resizeObserver.current.observe(ref.getContainer());
    }
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading || lastCommand.current === command) return;
    lastCommand.current = command;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 500;
    if (focus)
      map.flyTo({
        center: [focus.location.lng, focus.location.lat],
        zoom: focus.zoom,
        padding,
        duration,
      });
    else map.fitBounds(bounds, { padding, maxZoom: 14, duration });
  }, [bounds, command, focus, loading]);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setFailed(true), 20_000);
    return () => window.clearTimeout(timeout);
  }, [loading]);

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
        padding,
      });
      return;
    }

    onSelect(String(feature.properties.id));
  }

  return (
    <div className="relative h-full">
      <Map
        ref={setMapRef}
        mapStyle={MAP_STYLES[theme]}
        initialViewState={
          initialCamera ?? {
            bounds,
            fitBoundsOptions: { padding, maxZoom: 14 },
          }
        }
        onLoad={(e) => {
          const map = e.target;
          lastCommand.current = command;
          setLoading(false);
          setFailed(false);
          if (focus) {
            map.jumpTo({
              center: [focus.location.lng, focus.location.lat],
              zoom: focus.zoom,
              padding,
            });
            return;
          }
          if (!initialCamera)
            map.fitBounds(bounds, {
              padding,
              maxZoom: 14,
              duration: 0,
            });
        }}
        onMoveEnd={(event) => {
          const { longitude, latitude, zoom } = event.viewState;
          onCameraChange({ longitude, latitude, zoom });
        }}
        onError={() => setFailed(true)}
        onIdle={() => {
          if (mapRef.current?.isStyleLoaded()) setFailed(false);
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
              className="block size-4 rounded-full border-3 border-card bg-foreground"
            />
          </Marker>
        )}
      </Map>
      {(loading || failed) && (
        <div
          role={failed ? "alert" : "status"}
          className="absolute inset-0 flex items-center justify-center gap-2 bg-background p-6 text-center text-sm text-muted-foreground"
        >
          {failed ? (
            tPasar("mapError")
          ) : (
            <>
              <LoaderCircle
                className="size-5 shrink-0 animate-spin"
                aria-hidden
              />
              {tPasar("mapLoading")}
            </>
          )}
        </div>
      )}
    </div>
  );
}
