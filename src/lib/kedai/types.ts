import type { LatLng } from "@/lib/pasar/types";

export type BusinessCategory = {
  id: string;
  slug: string;
  nameMs: string;
  nameEn: string;
  /** Lucide icon name, e.g. "cake". */
  icon: string | null;
  sortOrder: number;
};

/** An approved Peniaga Kecil business, as anyone may see it. */
export type Business = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  district: string;
  state: string;
  logoUrl: string | null;
  category: BusinessCategory | null;
  /**
   * Rough area only: the database moves the real spot 300 to 600 m in a fixed
   * direction. Never show it as an exact pin. null until the owner sets one.
   */
  area: LatLng | null;
};

/** Something a Peniaga Kecil business sells. */
export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  priceRm: number | null;
  photoUrl: string | null;
  isAvailable: boolean;
};

/** Everything the public business page shows. */
export type BusinessDetail = Business & {
  whatsapp: string | null;
  instagram: string | null;
  hours: string | null;
  deliveryNotes: string | null;
  items: CatalogItem[];
};
