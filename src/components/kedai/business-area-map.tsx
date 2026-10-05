"use client";

import dynamic from "next/dynamic";
import { MapPlaceholder } from "@/components/layout/map-placeholder";
import type { Business } from "@/lib/kedai/types";
import { AREA_MAX_ZOOM } from "./kedai-map";

// MapLibre needs the browser (WebGL), so it never renders on the server.
const KedaiMap = dynamic(() => import("./kedai-map"), {
  ssr: false,
  loading: () => <MapPlaceholder section="kedai" />,
});

/** One business's rough area (never an exact pin), for its own page. */
export function BusinessAreaMap({ business }: { business: Business }) {
  if (!business.area) return <MapPlaceholder section="kedai" />;
  return (
    <KedaiMap
      businesses={[business]}
      selectedId={business.id}
      onSelect={() => {}}
      focus={{ location: business.area, zoom: AREA_MAX_ZOOM - 0.5, key: 1 }}
      userLocation={null}
    />
  );
}
