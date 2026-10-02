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
