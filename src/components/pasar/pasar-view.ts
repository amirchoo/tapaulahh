import {
  distanceMetres,
  pasarStatus,
  runsOn,
  schedulesOn,
  toMinutes,
  type MalaysiaNow,
  type PasarStatus,
} from "@/lib/pasar/schedule";
import type {
  DayOfWeek,
  LatLng,
  Pasar,
  PasarSchedule,
} from "@/lib/pasar/types";

export type PasarView = {
  pasar: Pasar;
  /** Only in "today" mode. */
  status: PasarStatus | null;
  /** Sessions on the selected day. */
  sessions: PasarSchedule[];
  distance: number | null;
};

const STATUS_RANK: Record<PasarStatus["kind"], number> = {
  open: 0,
  later: 1,
  closed: 2,
};

/** Pasars for the chosen day, with status and distance, sorted for the list. */
export function buildPasarViews(
  pasars: Pasar[],
  day: DayOfWeek,
  now: MalaysiaNow | null,
  isToday: boolean,
  userLocation: LatLng | null,
): PasarView[] {
  const views = pasars.flatMap((pasar): PasarView[] => {
    const status = isToday && now ? pasarStatus(pasar, now) : null;
    // Keep last night's session in "today" while it's still running past midnight.
    if (!runsOn(pasar, day) && status?.kind !== "open") return [];
    return [
      {
        pasar,
        status,
        sessions:
          status?.kind === "open" ? [status.schedule] : schedulesOn(pasar, day),
        distance: userLocation
          ? distanceMetres(userLocation, pasar.location)
          : null,
      },
    ];
  });

  return views.sort(
    (a, b) =>
      (a.status && b.status
        ? STATUS_RANK[a.status.kind] - STATUS_RANK[b.status.kind]
        : 0) ||
      (a.distance !== null && b.distance !== null
        ? a.distance - b.distance
        : 0) ||
      toMinutes(a.sessions[0]?.startTime ?? "00:00") -
        toMinutes(b.sessions[0]?.startTime ?? "00:00") ||
      a.pasar.name.localeCompare(b.pasar.name),
  );
}
