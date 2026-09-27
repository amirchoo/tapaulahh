import type { ReactNode } from "react";

/**
 * Map-style layout used by pasar and kedai pages.
 * Mobile: `main` fills the screen, `panel` sits in a bottom sheet over it
 * (made draggable in Part 4). Desktop: ~400px left panel, `main` on the right.
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
      <aside className="absolute inset-x-0 bottom-0 z-10 max-h-[50%] overflow-y-auto rounded-t-2xl border-t bg-card shadow-sheet lg:static lg:order-1 lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none">
        <div
          aria-hidden
          className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border lg:hidden"
        />
        {panel}
      </aside>
    </div>
  );
}
