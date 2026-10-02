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

/** Everything the public pasar page shows. */
export type PasarDetail = Pasar & {
  description: string | null;
  parkingNotes: string | null;
  photos: string[];
};

export type VendorCategory = {
  id: string;
  slug: string;
  nameMs: string;
  nameEn: string;
  /** Lucide icon name, e.g. "flame". */
  icon: string | null;
  sortOrder: number;
};

/** A stall at a pasar (public fields). */
export type Vendor = {
  id: string;
  slug: string;
  name: string;
  category: VendorCategory | null;
  description: string | null;
  priceRange: string | null;
  photos: string[];
  usualDays: DayOfWeek[];
};
