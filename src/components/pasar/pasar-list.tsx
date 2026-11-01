"use client";

import { ChevronRight, MapPin, Store } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { formatKm, formatTime } from "./format";
import type { PasarView } from "./pasar-view";

export function PasarList({
  views,
  onShowMap,
}: {
  views: PasarView[];
  onShowMap: (id: string, button: HTMLButtonElement) => void;
}) {
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {views.map((view) => (
        <PasarRow
          key={view.pasar.id}
          view={view}
          onShowMap={(button) => onShowMap(view.pasar.id, button)}
        />
      ))}
    </ul>
  );
}

function PasarRow({
  view,
  onShowMap,
}: {
  view: PasarView;
  onShowMap: (button: HTMLButtonElement) => void;
}) {
  const t = useTranslations("PasarMap");
  const tMap = useTranslations("Map");
  const locale = useLocale();
  const { pasar, distance } = view;

  return (
    <li
      id={`pasar-${pasar.id}`}
      className="flex min-w-0 flex-col border bg-card"
    >
      <Link
        href={{ pathname: "/pasar/[slug]", params: { slug: pasar.slug } }}
        className="grid flex-1 grid-cols-[72px_minmax(0,1fr)] gap-3 p-4 outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-4"
      >
        <span className="relative block aspect-square overflow-hidden bg-muted">
          {pasar.coverPhoto ? (
            <Image
              src={pasar.coverPhoto}
              alt=""
              fill
              sizes="(min-width: 640px) 96px, 72px"
              className="object-cover"
            />
          ) : (
            <span
              className="flex h-full items-center justify-center text-pasar-text"
              aria-hidden
            >
              <Store className="size-7" />
            </span>
          )}
        </span>
        <span className="min-w-0 break-words">
          <span className="block text-lg leading-snug font-bold">
            {pasar.name}
          </span>
          <StatusLine view={view} />
          <span className="mt-1 block text-sm text-muted-foreground">
            {pasar.district} · {pasar.state}
          </span>
          {distance !== null && (
            <span className="mt-1 block text-sm font-semibold text-muted-foreground">
              {tMap("away", { distance: formatKm(distance, locale) })}
            </span>
          )}
        </span>
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-x-3 border-t px-4">
        <Link
          href={{ pathname: "/pasar/[slug]", params: { slug: pasar.slug } }}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-pasar-text outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t("viewPasar")}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={(event) => onShowMap(event.currentTarget)}
          aria-haspopup="dialog"
          aria-label={t("showOnMapLabel", { name: pasar.name })}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold outline-none hover:text-pasar-text focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <MapPin className="size-4" aria-hidden />
          {t("showOnMap")}
        </button>
      </div>
    </li>
  );
}

export function StatusLine({ view }: { view: PasarView }) {
  const t = useTranslations("Status");
  const locale = useLocale();
  const { status, sessions } = view;
  const hours = sessions
    .map((s) =>
      t("hours", {
        start: formatTime(s.startTime, locale),
        end: formatTime(s.endTime, locale),
      }),
    )
    .join(", ");

  if (!status) {
    return <span className="mt-1 block text-sm font-semibold">{hours}</span>;
  }

  if (status.kind === "open") {
    return (
      <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-open">
        <span aria-hidden className="size-2 rounded-full bg-open" />
        {t("openUntil", { time: formatTime(status.schedule.endTime, locale) })}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "mt-1 block text-sm font-semibold",
        status.kind === "later" ? "text-pasar-text" : "text-muted-foreground",
      )}
    >
      {status.kind === "later"
        ? t("later", { time: formatTime(status.schedule.startTime, locale) })
        : t("closed")}
      <span className="font-normal text-muted-foreground"> · {hours}</span>
    </span>
  );
}
