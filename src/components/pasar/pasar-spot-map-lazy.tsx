"use client";

import dynamic from "next/dynamic";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

function LoadingLocationMap() {
  const t = useTranslations("PasarMap");
  return (
    <div
      role="status"
      className="flex h-full items-center justify-center gap-2 bg-background p-6 text-muted-foreground"
    >
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      {t("mapLoading")}
    </div>
  );
}

/** Mounted only after someone opens a market's location dialog. */
export const PasarSpotMapLazy = dynamic(() => import("./pasar-spot-map"), {
  ssr: false,
  loading: () => <LoadingLocationMap />,
});
