import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { ReviewSummary, ReviewTargetType } from "./types";

/** Visible reviews (newest first) with their average. Cached like other public data. */
export async function getReviews(
  targetType: ReviewTargetType,
  targetId: string,
): Promise<ReviewSummary> {
  const { data, error } = await createPublicClient().rpc("reviews_for", {
    p_target_type: targetType,
    p_target_id: targetId,
  });
  if (error) throw new Error(`Failed to load reviews: ${error.message}`);

  const reviews = data.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    authorName: r.author_name,
    authorAvatar: r.author_avatar,
  }));
  const count = reviews.length;
  const average = count
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
    : null;
  return { reviews, count, average };
}
