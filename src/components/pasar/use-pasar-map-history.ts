"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHANGE = "tapaulahh:pasar-map";
const ENTRY = "tapaulahhPasarMap";
const getSnapshot = () =>
  new URLSearchParams(window.location.search).get("map") === "1";
const getServerSnapshot = () => false;
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(CHANGE, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(CHANGE, listener);
  };
}

/** Give the map its own history entry, so Back closes it before leaving the list. */
export function usePasarMapHistory() {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setOpen = useCallback((next: boolean) => {
    if (next === getSnapshot()) return;
    const url = new URL(window.location.href);
    if (next) {
      url.searchParams.set("map", "1");
      window.history.pushState({ [ENTRY]: true }, "", url);
    } else if (window.history.state?.[ENTRY]) {
      window.history.back();
      return;
    } else {
      // A directly opened /pasar?map=1 has no list entry to go back to.
      url.searchParams.delete("map");
      window.history.replaceState(null, "", url);
    }
    window.dispatchEvent(new Event(CHANGE));
  }, []);
  return { open, setOpen };
}
