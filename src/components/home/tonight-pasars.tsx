"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Placeholder } from "@/components/layout/panel";
import { StatusLine } from "@/components/pasar/pasar-list";
import { buildPasarViews } from "@/components/pasar/pasar-view";
import { useMalaysiaNow } from "@/components/pasar/use-malaysia-now";
import { Link } from "@/i18n/navigation";
import type { Pasar } from "@/lib/pasar/types";

/** Pasars running today with live status. Client-only: depends on the current time. */
export function TonightPasars({ pasars }: { pasars: Pasar[] }) {
  const t = useTranslations("PasarMap");
  const now = useMalaysiaNow();

  const views = useMemo(
    () => (now ? buildPasarViews(pasars, now.day, now, true, null) : []),
    [pasars, now],
  );

  if (!now) {
    return (
      <div aria-hidden className="flex gap-3 overflow-hidden">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-28 w-64 shrink-0 animate-pulse rounded-xl border bg-card"
          />
        ))}
      </div>
    );
  }

  if (views.length === 0) return <Placeholder>{t("empty")}</Placeholder>;

  return (
    <ul className="-mx-4 flex snap-x scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
      {views.map((view) => (
        <li key={view.pasar.id} className="w-64 shrink-0 snap-start lg:w-auto">
          <Link
            href={`/pasar/${view.pasar.slug}`}
            className="block h-full rounded-xl border bg-card p-4 transition-colors outline-none hover:border-pasar focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="block font-bold">{view.pasar.name}</span>
            <StatusLine view={view} />
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {view.pasar.address}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
