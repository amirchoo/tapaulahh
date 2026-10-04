export type ReviewTargetType = "pasar" | "vendor";

export type Review = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorAvatar: string | null;
};

export type ReviewSummary = {
  reviews: Review[];
  count: number;
  /** null when there are no reviews yet. */
  average: number | null;
};

export const REVIEW_MAX = 1000;
