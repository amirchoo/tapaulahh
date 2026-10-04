import type { ReactNode } from "react";
import { BottomSheet } from "./bottom-sheet";

/**
 * Map-style layout used by pasar and kedai pages.
 * Mobile: `main` fills the screen, `panel` sits in a draggable bottom sheet
 * over it (peek / half / full). Desktop: ~400px left panel, `main` on the right.
 */
export function SplitView({
  panel,
  main,
}: {
  panel: ReactNode;
  main: ReactNode;
}) {
  return (
    <div className="relative h-full lg:grid lg:grid-cols-[400px_minmax(0,1fr)]">
      <div className="absolute inset-0 lg:static lg:order-2">{main}</div>
      <BottomSheet>{panel}</BottomSheet>
    </div>
  );
}
