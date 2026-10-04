"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Sheet heights as a share of the area between the header and tab bar. */
const SNAPS = [0.22, 0.5, 1];
const START = 1; // half
/** A flick faster than this (px/ms) jumps to the next size. */
const FLICK = 0.5;

const heightOf = (i: number) => `${SNAPS[i] * 100}%`;

type Drag = {
  startY: number;
  startHeight: number;
  parentHeight: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
};

/**
 * Phones: the panel is a bottom sheet over the map. Drag the handle (or tap
 * it) to peek, half or full screen; the content scrolls inside. From lg up
 * it's a plain side panel and none of this applies.
 */
export function BottomSheet({ children }: { children: ReactNode }) {
  const t = useTranslations("Sheet");
  const ref = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [snap, setSnap] = useState(START);
  const [dragging, setDragging] = useState(false);

  function setHeight(value: string) {
    ref.current?.style.setProperty("--sheet-h", value);
  }

  function settle(index: number) {
    // Set it directly too: if the snap didn't change, React won't touch the
    // style, and the drag's pixel height would stay.
    setHeight(heightOf(index));
    setSnap(index);
    // Peeking shows only the top, so bring the title back into view.
    if (index === 0) content.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onPointerDown(e: React.PointerEvent) {
    const sheet = ref.current;
    const parent = sheet?.parentElement;
    if (!sheet || !parent) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      startY: e.clientY,
      startHeight: sheet.getBoundingClientRect().height,
      parentHeight: parent.getBoundingClientRect().height,
      lastY: e.clientY,
      lastTime: e.timeStamp,
      velocity: 0,
      moved: false,
    };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dy = d.startY - e.clientY; // up is positive
    if (Math.abs(dy) > 4) d.moved = true;
    const dt = e.timeStamp - d.lastTime;
    if (dt > 0) d.velocity = (d.lastY - e.clientY) / dt;
    d.lastY = e.clientY;
    d.lastTime = e.timeStamp;
    const min = SNAPS[0] * d.parentHeight;
    const height = Math.min(d.parentHeight, Math.max(min, d.startHeight + dy));
    setHeight(`${height}px`);
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d) return;

    // A tap: half ↔ full (from peek, open to half).
    if (!d.moved) {
      settle(
        snap === SNAPS.length - 1
          ? START
          : snap === 0
            ? START
            : SNAPS.length - 1,
      );
      return;
    }
    const height = ref.current?.getBoundingClientRect().height ?? 0;
    const share = height / d.parentHeight;
    let next = SNAPS.reduce(
      (best, s, i) =>
        Math.abs(s - share) < Math.abs(SNAPS[best] - share) ? i : best,
      0,
    );
    // A quick flick goes one step further in its direction.
    if (d.velocity > FLICK) {
      next = Math.max(
        next,
        SNAPS.findIndex((s) => s > share),
      );
    } else if (d.velocity < -FLICK) {
      const lower = SNAPS.findLastIndex((s) => s < share);
      next = Math.min(next, lower === -1 ? 0 : lower);
    }
    if (next === -1) next = SNAPS.length - 1;
    settle(next);
  }

  const isFull = snap === SNAPS.length - 1;

  return (
    <aside
      ref={ref}
      style={{ "--sheet-h": heightOf(snap) } as React.CSSProperties}
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 flex h-(--sheet-h) flex-col border-t-2 bg-card",
        !dragging && "transition-[height] duration-300 ease-out",
        "lg:static lg:order-1 lg:block lg:h-auto lg:overflow-y-auto lg:border-t-0 lg:border-r lg:transition-none",
      )}
    >
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") settle(Math.min(snap + 1, SNAPS.length - 1));
          if (e.key === "ArrowDown") settle(Math.max(snap - 1, 0));
        }}
        // Pointer handlers cover taps; Enter/Space from the keyboard land here.
        onClick={(e) => {
          if (e.detail === 0) settle(isFull ? START : SNAPS.length - 1);
        }}
        aria-label={isFull ? t("collapse") : t("expand")}
        aria-expanded={isFull}
        className="flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:cursor-grabbing lg:hidden"
      >
        <span aria-hidden className="h-1 w-10 bg-border" />
      </button>
      <div
        ref={content}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:overflow-visible"
      >
        {children}
      </div>
    </aside>
  );
}
