import type { LatLng } from "@/lib/pasar/types";

const NUM = String.raw`(-?\d{1,3}(?:\.\d+)?)`;

/**
 * Reads coordinates from what an admin pastes: a full Google Maps link or
 * plain "3.0738, 101.5183". Short links (maps.app.goo.gl) must be expanded
 * first (see expandMapsLink). Returns null when nothing usable is found.
 */
export function parseLocation(input: string): LatLng | null {
  const text = decodeURIComponent(input.trim());
  const patterns = [
    // The place's own pin: …!3d3.0738!4d101.5183…
    new RegExp(String.raw`!3d${NUM}!4d${NUM}`),
    // ?q=3.07,101.51  ?query=…  ?ll=…  ?destination=…
    new RegExp(
      String.raw`[?&](?:q|query|ll|destination|center)=${NUM},\s*${NUM}`,
    ),
    // /search/3.07,+101.51  /place/3.07,101.51
    new RegExp(String.raw`/(?:search|place|dir)/${NUM},\s*\+?${NUM}`),
    // The map's centre: …/@3.0738,101.5183,17z
    new RegExp(String.raw`@${NUM},${NUM}`),
    // Plain "3.0738, 101.5183"
    new RegExp(String.raw`^${NUM}\s*,\s*${NUM}$`),
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

/** Peninsular + East Malaysia, generously. Catches swapped lat/lng too. */
export function isInMalaysia({ lat, lng }: LatLng): boolean {
  return lat > 0.8 && lat < 7.6 && lng > 99.5 && lng < 119.5;
}

export function googleMapsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
