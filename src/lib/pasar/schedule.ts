import type { DayOfWeek, LatLng, Pasar, PasarSchedule } from "./types";

export const TIME_ZONE = "Asia/Kuala_Lumpur";
const DAY_MINUTES = 24 * 60;

/** Days in display order, Monday first (as Malaysians read a week). */
export const WEEK: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

const WEEKDAY_INDEX: Record<string, DayOfWeek> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type MalaysiaNow = { day: DayOfWeek; minutes: number };

/** Current weekday and minutes since midnight in Malaysia, whatever the device time zone. */
export function malaysiaNow(date: Date): MalaysiaNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return {
    day: WEEKDAY_INDEX[get("weekday")],
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** End in minutes from the schedule day's midnight; past-midnight ends go above 24h. */
function endMinutes(s: PasarSchedule): number {
  const start = toMinutes(s.startTime);
  const end = toMinutes(s.endTime);
  return end <= start ? end + DAY_MINUTES : end;
}

export function schedulesOn(pasar: Pasar, day: DayOfWeek): PasarSchedule[] {
  return pasar.schedules.filter((s) => s.dayOfWeek === day);
}

export function runsOn(pasar: Pasar, day: DayOfWeek): boolean {
  return pasar.schedules.some((s) => s.dayOfWeek === day);
}

export type PasarStatus =
  | { kind: "open"; schedule: PasarSchedule }
  | { kind: "later"; schedule: PasarSchedule }
  | { kind: "closed" };

/** Status for "right now". Includes last night's session if it runs past midnight. */
export function pasarStatus(pasar: Pasar, now: MalaysiaNow): PasarStatus {
  const yesterday = ((now.day + 6) % 7) as DayOfWeek;
  for (const s of schedulesOn(pasar, yesterday)) {
    if (now.minutes + DAY_MINUTES < endMinutes(s))
      return { kind: "open", schedule: s };
  }

  const today = [...schedulesOn(pasar, now.day)].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
  );
  for (const s of today) {
    const start = toMinutes(s.startTime);
    if (now.minutes >= start && now.minutes < endMinutes(s)) {
      return { kind: "open", schedule: s };
    }
    if (now.minutes < start) return { kind: "later", schedule: s };
  }
  return { kind: "closed" };
}

/** Straight-line distance in metres. */
export function distanceMetres(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
