import "server-only";
import type { LatLng } from "@/lib/pasar/types";
import { isInMalaysia, parseLocation } from "./parse-location";

const GOOGLE_HOSTS =
  /^(maps\.app\.goo\.gl|goo\.gl|g\.co|(www\.|maps\.)?google\.com(\.my)?)$/;

/** maps.app.goo.gl/… → the full google.com/maps link it points to. */
async function expandMapsLink(input: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return input; // plain "lat, lng"
  }
  for (let hop = 0; hop < 5; hop++) {
    if (url.protocol !== "https:" || !GOOGLE_HOSTS.test(url.hostname)) break;
    if (/[!@]|[?&](q|query|ll)=-?\d/.test(url.href)) break;
    const res = await fetch(url, { redirect: "manual", cache: "no-store" });
    const next = res.headers.get("location");
    if (!next) break;
    url = new URL(next, url);
  }
  return url.href;
}

export async function readLocation(
  input: string,
): Promise<LatLng | "locationUnreadable" | "locationOutside"> {
  const location = parseLocation(await expandMapsLink(input));
  if (!location) return "locationUnreadable";
  if (!isInMalaysia(location)) return "locationOutside";
  return location;
}
