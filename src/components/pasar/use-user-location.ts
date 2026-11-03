"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/pasar/types";
import { MALAYSIA_BOUNDS } from "./map-style";

export type Locating = "idle" | "locating" | "denied" | "outside";

/** The visitor's neighbourhood, a few km across. */
export const NEAR_ME_ZOOM = 12.5;

const OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 300_000,
};

function inMalaysia({ lat, lng }: LatLng) {
  const [[west, south], [east, north]] = MALAYSIA_BOUNDS;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

/**
 * The visitor's location, asked for once when the map opens and again on
 * "Dekat saya". A refusal on open stays quiet (the map just shows the Klang
 * Valley); only a tap on the button reports why it didn't work. Locations
 * outside Malaysia are ignored, there's nothing to show there.
 */
export function useUserLocation(onFound: (location: LatLng) => void) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState<Locating>("idle");
  const onFoundRef = useRef(onFound);
  useEffect(() => {
    onFoundRef.current = onFound;
  });

  function request(fromTap: boolean) {
    if (!("geolocation" in navigator)) {
      if (fromTap) setLocating("denied");
      return;
    }
    if (fromTap) setLocating("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lat: coords.latitude, lng: coords.longitude };
        if (!inMalaysia(location)) {
          setLocating(fromTap ? "outside" : "idle");
          return;
        }
        setUserLocation(location);
        setLocating("idle");
        onFoundRef.current(location);
      },
      () => setLocating(fromTap ? "denied" : "idle"),
      OPTIONS,
    );
  }

  const requestRef = useRef(request);
  useEffect(() => {
    requestRef.current(false);
  }, []);

  return { userLocation, locating, locate: () => request(true) };
}
