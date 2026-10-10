"use client";

import { getVersion, type Map as MapLibreMap, setWorkerUrl } from "maplibre-gl";

// Served from /public by scripts/copy-maplibre-worker.mjs.
setWorkerUrl(`/vendor/maplibre-gl@${getVersion()}/maplibre-gl-worker.mjs`);

export const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/fiord",
} as const;

/** Tracks the `dark` class next-themes puts on <html> (set after React renders). */
export function subscribeHtmlClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  return () => observer.disconnect();
}
export const isDarkClass = () =>
  document.documentElement.classList.contains("dark");

/**
 * OpenFreeMap's fiord style asks for "circle-11" but its sprite names the icon
 * "circle_11". Serve the underscore icon under the requested id.
 */
export function aliasMissingIcons(map: MapLibreMap) {
  map.setMissingStyleImageResolver((id) => {
    const alias = id.replaceAll("-", "_");
    if (alias === id || !map.hasImage(alias)) return;
    const { data, pixelRatio, sdf } = map.getImage(alias);
    map.addImage(id, data, { pixelRatio, sdf });
  });
}

/**
 * Opening view: all of Malaysia, Peninsular and East (Sabah, Sarawak).
 * Pins group into clusters until you zoom in.
 * [[west, south], [east, north]]
 */
export const START_BOUNDS: [[number, number], [number, number]] = [
  [99.6, 0.85],
  [119.3, 7.4],
];

const DESKTOP_QUERY = "(min-width: 1024px)";

/** On mobile the bottom sheet covers the lower half; keep the camera centred above it. */
export function cameraPadding(container: HTMLElement) {
  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
  const base = 48;
  return {
    top: base,
    left: base,
    right: base,
    bottom: isDesktop ? base : Math.round(container.clientHeight * 0.5) + 24,
  };
}
