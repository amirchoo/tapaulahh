/** 0 = Sunday … 6 = Saturday (same as JS Date#getDay and pasar_schedules.day_of_week). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type LatLng = { lat: number; lng: number };

export type PasarSchedule = {
  dayOfWeek: DayOfWeek;
  /** "HH:MM", 24h, Malaysia time. An end at or before the start runs past midnight. */
  startTime: string;
  endTime: string;
};

/** Public fields of a pasar, mirroring the `pasars` + `pasar_schedules` tables (VISION §6). */
export type Pasar = {
  id: string;
  slug: string;
  name: string;
  address: string;
  district: string;
  state: string;
  location: LatLng;
  schedules: PasarSchedule[];
};
