import type { Pasar } from "./types";

/*
 * TEMPORARY sample data so the map can be built before Supabase (Part 2).
 * Areas are real Shah Alam pasar malam spots, but days, hours and coordinates
 * are approximate and UNVERIFIED. Check them before they go into seed.sql.
 */
export const SAMPLE_PASARS: Pasar[] = [
  {
    id: "sample-seksyen-7",
    slug: "seksyen-7",
    name: "Pasar Malam Seksyen 7",
    address: "Jalan Plumbum, Seksyen 7",
    district: "Shah Alam",
    state: "Selangor",
    location: { lat: 3.0727, lng: 101.4905 },
    schedules: [{ dayOfWeek: 3, startTime: "17:00", endTime: "23:00" }],
  },
  {
    id: "sample-seksyen-9",
    slug: "seksyen-9",
    name: "Pasar Malam Seksyen 9",
    address: "Seksyen 9",
    district: "Shah Alam",
    state: "Selangor",
    location: { lat: 3.0806, lng: 101.5025 },
    schedules: [{ dayOfWeek: 0, startTime: "17:00", endTime: "22:30" }],
  },
  {
    id: "sample-seksyen-13",
    slug: "seksyen-13",
    name: "Pasar Malam Seksyen 13",
    address: "Seksyen 13, dekat Stadium Shah Alam",
    district: "Shah Alam",
    state: "Selangor",
    location: { lat: 3.0839, lng: 101.5436 },
    schedules: [{ dayOfWeek: 6, startTime: "17:00", endTime: "23:30" }],
  },
  {
    id: "sample-seksyen-17",
    slug: "seksyen-17",
    name: "Pasar Malam Seksyen 17",
    address: "Seksyen 17",
    district: "Shah Alam",
    state: "Selangor",
    location: { lat: 3.0508, lng: 101.5122 },
    schedules: [{ dayOfWeek: 2, startTime: "17:00", endTime: "22:30" }],
  },
  {
    id: "sample-seksyen-24",
    slug: "seksyen-24",
    name: "Pasar Malam Seksyen 24",
    address: "Seksyen 24",
    district: "Shah Alam",
    state: "Selangor",
    location: { lat: 3.0397, lng: 101.5233 },
    schedules: [{ dayOfWeek: 4, startTime: "17:00", endTime: "23:00" }],
  },
  {
    id: "sample-kota-kemuning",
    slug: "kota-kemuning",
    name: "Pasar Malam Kota Kemuning",
    address: "Seksyen 31, Kota Kemuning",
    district: "Shah Alam",
    state: "Selangor",
    location: { lat: 3.0075, lng: 101.5398 },
    schedules: [
      { dayOfWeek: 1, startTime: "17:00", endTime: "23:00" },
      { dayOfWeek: 5, startTime: "17:00", endTime: "00:30" },
    ],
  },
  {
    id: "sample-setia-alam",
    slug: "setia-alam",
    name: "Pasar Malam Setia Alam",
    address: "Seksyen U13, Setia Alam",
    district: "Shah Alam",
    state: "Selangor",
    location: { lat: 3.1063, lng: 101.4589 },
    schedules: [{ dayOfWeek: 2, startTime: "17:30", endTime: "23:30" }],
  },
  {
    id: "sample-bukit-jelutong",
    slug: "bukit-jelutong",
    name: "Pasar Malam Bukit Jelutong",
    address: "Seksyen U8, Bukit Jelutong",
    district: "Shah Alam",
    state: "Selangor",
    location: { lat: 3.1003, lng: 101.5312 },
    schedules: [{ dayOfWeek: 5, startTime: "17:00", endTime: "23:00" }],
  },
];
