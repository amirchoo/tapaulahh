import type { Locale } from "@/i18n/routing";
import { toMinutes } from "@/lib/pasar/schedule";

/** "17:00" → "5:00 PTG" (ms) / "5:00 pm" (en). */
export function formatTime(time: string, locale: Locale): string {
  const minutes = toMinutes(time);
  const date = new Date(
    Date.UTC(2000, 0, 1, Math.floor(minutes / 60), minutes % 60),
  );
  return new Intl.DateTimeFormat(locale === "ms" ? "ms-MY" : "en-MY", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
}

export function formatKm(metres: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ms" ? "ms-MY" : "en-MY", {
    maximumFractionDigits: metres < 10_000 ? 1 : 0,
  }).format(metres / 1000);
}
