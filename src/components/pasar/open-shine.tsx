"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import ShinyText from "@/components/ui/shiny-text";

/** Re-read the tokens when next-themes flips the `dark` class on <html>. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  return () => observer.disconnect();
}

// ShinyText needs real colour values, so read the tokens from globals.css.
function readColors() {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string) => style.getPropertyValue(name).trim();
  return `${v("--open")}|${v("--open-shine")}`;
}

/**
 * "Buka sekarang" with a slow light sweeping across it, like a lamp coming on.
 * Plain green text on the server and when the tokens aren't readable;
 * ShinyText itself stops the sweep for prefers-reduced-motion.
 */
export function OpenShine({ children }: { children: ReactNode }) {
  const colors = useSyncExternalStore(subscribe, readColors, () => "");
  const [color, shine] = colors.split("|");
  if (!color || !shine) return <span className="text-open">{children}</span>;

  return (
    <ShinyText color={color} shineColor={shine} speed={2.4} delay={2.6}>
      {children}
    </ShinyText>
  );
}
