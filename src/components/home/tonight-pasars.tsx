"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Placeholder } from "@/components/layout/panel";
import { StatusLine } from "@/components/pasar/pasar-list";
import { buildPasarViews, type PasarView } from "@/components/pasar/pasar-view";
import { useMalaysiaNow } from "@/components/pasar/use-malaysia-now";
import { Link } from "@/i18n/navigation";
import type { DayOfWeek, Pasar } from "@/lib/pasar/types";
import { cn } from "@/lib/utils";

const RAIL =
  "-mx-4 flex snap-x scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0";
const CARD = "w-[78%] max-w-72 shrink-0 snap-start lg:w-auto lg:max-w-none";

/** Pasars running today with live status, as photo cards. Client-only: depends on the current time. */
export function TonightPasars({ pasars }: { pasars: Pasar[] }) {
  const t = useTranslations("Landing");
  const tMap = useTranslations("PasarMap");
  const now = useMalaysiaNow();

  const views = useMemo(
    () => (now ? buildPasarViews(pasars, now.day, now, true, null) : []),
    [pasars, now],
  );
  const tomorrow = useMemo(
    () =>
      now && views.length === 0
        ? buildPasarViews(
            pasars,
            ((now.day + 1) % 7) as DayOfWeek,
            null,
            false,
            null,
          )
        : [],
    [pasars, now, views.length],
  );

  if (!now) {
    return (
      <ul aria-hidden className={RAIL}>
        {[0, 1, 2].map((i) => (
          <li key={i} className={CARD}>
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="mt-3 h-4 w-3/4 animate-pulse bg-muted" />
            <div className="mt-2 h-4 w-1/2 animate-pulse bg-muted" />
          </li>
        ))}
      </ul>
    );
  }

  if (views.length > 0) return <Cards views={views} />;
  if (tomorrow.length === 0) return <Placeholder>{tMap("empty")}</Placeholder>;

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground">{t("noneTonight")}</p>
      <Cards views={tomorrow} />
    </div>
  );
}

function Cards({ views }: { views: PasarView[] }) {
  return (
    <ul className={RAIL}>
      {views.map((view) => {
        const lightsOff = view.status?.kind === "closed";
        return (
          <li key={view.pasar.id} className={CARD}>
            <Link
              href={{
                pathname: "/pasar/[slug]",
                params: { slug: view.pasar.slug },
              }}
              className="group block outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-muted">
                {view.pasar.coverPhoto && (
                  <Image
                    src={view.pasar.coverPhoto}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 320px, 78vw"
                    className={cn(
                      "object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]",
                      lightsOff && "opacity-50 grayscale",
                    )}
                  />
                )}
              </span>
              <span className="mt-3 block text-lg leading-snug font-bold group-hover:text-pasar-text">
                {view.pasar.name}
              </span>
              <StatusLine view={view} />
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {view.pasar.district}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
