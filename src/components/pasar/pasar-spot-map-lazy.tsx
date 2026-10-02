"use client";

import dynamic from "next/dynamic";
import { MapPlaceholder } from "@/components/layout/map-placeholder";

/** MapLibre needs the browser, so the map loads after the page. */
export const PasarSpotMapLazy = dynamic(() => import("./pasar-spot-map"), {
  ssr: false,
  loading: () => <MapPlaceholder section="pasar" />,
});
