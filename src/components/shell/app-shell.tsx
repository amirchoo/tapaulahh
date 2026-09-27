import type { ReactNode } from "react";
import { BottomTabBar } from "./nav-tabs";
import { SiteHeader } from "./site-header";

/**
 * Mobile (< lg): compact header, content, bottom tab bar.
 * Desktop (≥ lg): top nav with tabs; pages pick SplitView or ContentPage.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader />
      <main className="relative min-h-0 flex-1 overflow-y-auto">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
