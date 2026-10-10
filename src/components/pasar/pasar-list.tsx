"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { formatKm, formatTime } from "./format";
import type { PasarView } from "./pasar-view";

export function PasarList({
  views,
  selectedId,
  onSelect,
}: {
  views: PasarView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {views.map((view) => (
        <PasarRow
          key={view.pasar.id}
          view={view}
          selected={view.pasar.id === selectedId}
          onSelect={() => onSelect(view.pasar.id)}
        />
      ))}
    </ul>
  );
}

function PasarRow({
  view,
  selected,
  onSelect,
}: {
  view: PasarView;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("PasarMap");
  const tMap = useTranslations("Map");
  const locale = useLocale();
  const { pasar, distance } = view;

  return (
    <li
      id={`pasar-${pasar.id}`}
      className={cn(
        "scroll-my-3 border bg-card transition-colors",
        selected && "border-pasar ring-1 ring-pasar",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="w-full text-left outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {pasar.coverPhoto && (
          <span className="relative block aspect-[2/1] overflow-hidden bg-muted">
            <Image
              src={pasar.coverPhoto}
              alt=""
              fill
              sizes="(min-width: 1024px) 352px, 100vw"
              className="object-cover"
            />
          </span>
        )}
        <span className="block px-4 pt-3 pb-2">
          <span className="flex items-baseline justify-between gap-3">
            <span className="font-bold">{pasar.name}</span>
            {distance !== null && (
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {tMap("away", { distance: formatKm(distance, locale) })}
              </span>
            )}
          </span>
          <StatusLine view={view} />
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {pasar.address}
          </span>
        </span>
      </button>
      <Link
        href={{ pathname: "/pasar/[slug]", params: { slug: pasar.slug } }}
        className="flex h-11 items-center justify-between border-t px-4 text-sm font-semibold text-pasar-text outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {t("viewPasar")}
        <ChevronRight className="size-4" aria-hidden />
      </Link>
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
