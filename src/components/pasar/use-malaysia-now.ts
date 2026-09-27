"use client";

import { useSyncExternalStore } from "react";
import { malaysiaNow, type MalaysiaNow } from "@/lib/pasar/schedule";

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}

// Snapshot is the minute number, so it only changes once a minute.
const getMinute = () => Math.floor(Date.now() / MINUTE);
const getServerMinute = () => null;

/**
 * Current Malaysia day + time, updated each minute. `null` during server
 * render and hydration: pages are prerendered, so the server's clock is stale.
 */
export function useMalaysiaNow(): MalaysiaNow | null {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  return minute === null ? null : malaysiaNow(new Date(minute * MINUTE));
}
