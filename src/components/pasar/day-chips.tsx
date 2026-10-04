"use client";

import { useTranslations } from "next-intl";
import { WEEK } from "@/lib/pasar/schedule";
import type { DayOfWeek } from "@/lib/pasar/types";
import { cn } from "@/lib/utils";

export type DayFilter = "today" | DayOfWeek;

export function DayChips({
  value,
  onChange,
}: {
  value: DayFilter;
  onChange: (value: DayFilter) => void;
}) {
  const t = useTranslations("PasarMap");
  const tDays = useTranslations("Days");

  const chip = (key: DayFilter, label: string, title?: string) => {
    const active = value === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        aria-pressed={active}
        title={title}
        className={cn(
          "h-11 shrink-0 border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          active
            ? "border-pasar bg-pasar font-bold text-on-pasar"
            : "bg-card text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label={t("dayFilter")}
      className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 lg:-mx-6 lg:px-6"
    >
      {chip("today", t("today"))}
      {WEEK.map((day) =>
        chip(day, tDays(`short.${day}`), tDays(`long.${day}`)),
      )}
    </div>
  );
}
