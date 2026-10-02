import type { LatLng } from "./types";

/** Opens Google Maps (app on phones) with directions to the pasar. */
export function directionsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
