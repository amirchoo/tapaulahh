"use server";

import { refresh, updateTag } from "next/cache";
import { getAdminUser, getCurrentUser } from "@/lib/auth/session";
import { PUBLIC_DATA_TAG } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { REVIEW_MAX, type ReviewTargetType } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TARGET_TYPES: ReviewTargetType[] = ["pasar", "vendor"];

export type MyReview = {
  id: string;
  rating: number;
  body: string | null;
  status: "visible" | "hidden";
};

export type ReviewFormState = {
  error?: "signIn" | "ratingRequired" | "generic";
  saved?: MyReview;
};

/** Posts or updates the signed-in user's review (one per pasar/stall). */
export async function saveReviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "signIn" };

  const targetType = TARGET_TYPES.find((t) => t === formData.get("targetType"));
  const targetId = String(formData.get("targetId") ?? "");
  if (!targetType || !UUID_RE.test(targetId)) return { error: "generic" };

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "ratingRequired" };
  }
  const body =
    String(formData.get("body") ?? "")
      .trim()
      .slice(0, REVIEW_MAX) || null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        target_type: targetType,
        target_id: targetId,
        user_id: user.id,
        rating,
        body,
      },
      { onConflict: "target_type,target_id,user_id" },
    )
    .select("id, rating, body, status")
    .single();
  if (error) {
    console.error("Saving review failed:", error.message);
    return { error: "generic" };
  }

  updateTag(PUBLIC_DATA_TAG);
  refresh();
  return { saved: data };
}

/** Deletes the signed-in user's own review. */
export async function deleteReviewAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  if (!user || !UUID_RE.test(id)) return;

  const supabase = await createClient();
  await supabase.from("reviews").delete().eq("id", id).eq("user_id", user.id);
  updateTag(PUBLIC_DATA_TAG);
  refresh();
}

/** Admins: hide a review from the public (kept, so it can be restored). */
export async function hideReviewAction(formData: FormData) {
  if (!(await getAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ status: "hidden" })
    .eq("id", id);
  if (error) console.error("Hiding review failed:", error.message);
  updateTag(PUBLIC_DATA_TAG);
  refresh();
}
