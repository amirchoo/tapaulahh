"use client";

import { useTranslations } from "next-intl";
import type { Pasar } from "@/lib/pasar/types";
import { StatusLine } from "./pasar-list";
import { buildPasarViews } from "./pasar-view";
import { useMalaysiaNow } from "./use-malaysia-now";

/** "Open now · until 11 pm" for one pasar, computed on the visitor's device. */
export function PasarStatusNow({ pasar }: { pasar: Pasar }) {
  const t = useTranslations("Status");
  const now = useMalaysiaNow();
  if (!now) return <span className="mt-1 block h-5" />;

  const [view] = buildPasarViews([pasar], now.day, now, true, null);
  if (!view) {
    return (
      <span className="mt-1 block text-sm font-semibold text-muted-foreground">
        {t("notToday")}
      </span>
    );
  }
  return <StatusLine view={view} />;
}
