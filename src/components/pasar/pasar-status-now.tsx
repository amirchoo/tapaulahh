"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { nextSession } from "@/lib/pasar/schedule";
import type { DayOfWeek, Pasar } from "@/lib/pasar/types";
import { formatTime } from "./format";
import { StatusLine } from "./pasar-list";
import { buildPasarViews } from "./pasar-view";
import { useMalaysiaNow } from "./use-malaysia-now";

/**
 * "Open now · until 11 pm" for one pasar, computed on the visitor's device.
 * When it's closed or not on today, says when it opens next instead.
 */
export function PasarStatusNow({ pasar }: { pasar: Pasar }) {
  const t = useTranslations("Status");
  const tDays = useTranslations("Days");
  const locale = useLocale() as Locale;
  const now = useMalaysiaNow();
  if (!now) return <span className="mt-1 block h-5" />;

  const [view] = buildPasarViews([pasar], now.day, now, true, null);
  if (view && view.status?.kind !== "closed") return <StatusLine view={view} />;

  const next = nextSession(pasar, now);
  let nextText: string | null = null;
  if (next) {
    const day = tDays(`long.${((now.day + next.daysAhead) % 7) as DayOfWeek}`);
    const when =
      next.daysAhead === 1
        ? t("tomorrow")
        : next.daysAhead === 7
          ? t("nextWeek", { day })
          : day;
    nextText = t("nextOpen", {
      when,
      time: formatTime(next.schedule.startTime, locale),
    });
  }

  return (
    <span className="mt-1 block text-sm font-semibold text-muted-foreground">
      {view ? t("closed") : t("notToday")}
      {nextText && (
        <>
          {" · "}
          <span className="text-pasar-text">{nextText}</span>
        </>
      )}
    </span>
  );
}
