"use client";

import { EyeOff, Pencil, Star, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { Avatar } from "@/components/auth/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  deleteReviewAction,
  hideReviewAction,
  saveReviewAction,
  type MyReview,
  type ReviewFormState,
} from "@/lib/reviews/actions";
import {
  REVIEW_MAX,
  type Review,
  type ReviewSummary,
  type ReviewTargetType,
} from "@/lib/reviews/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Stars } from "./stars";

type Viewer = { id: string; isAdmin: boolean } | null;

/**
 * Community reviews for a pasar or stall. The list comes from the server
 * (cached); who's viewing (to show "write a review", their own review, or the
 * admin hide button) is worked out in the browser so the page stays cacheable.
 */
export function ReviewsSection({
  targetType,
  targetId,
  summary,
}: {
  targetType: ReviewTargetType;
  targetId: string;
  summary: ReviewSummary;
}) {
  const t = useTranslations("Reviews");
  // undefined while checking; null when signed out.
  const [viewer, setViewer] = useState<Viewer | undefined>(undefined);
  const [mine, setMine] = useState<MyReview | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        if (active) setViewer(null);
        return;
      }
      const [{ data: profile }, { data: review }] = await Promise.all([
        supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("reviews")
          .select("id, rating, body, status")
          .eq("target_type", targetType)
          .eq("target_id", targetId)
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (!active) return;
      setViewer({ id: user.id, isAdmin: profile?.role === "admin" });
      setMine(review);
    })();
    return () => {
      active = false;
    };
  }, [targetType, targetId]);

  return (
    <section id="ulasan" className="scroll-mt-4 space-y-4">
      <h2 className="font-extrabold">{t("title", { count: summary.count })}</h2>

      <Composer
        viewer={viewer}
        mine={mine}
        onChange={setMine}
        targetType={targetType}
        targetId={targetId}
      />

      {summary.count === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-4">
          {/* Your own review is already shown in the card above. */}
          {summary.reviews
            .filter((review) => review.id !== mine?.id)
            .map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                canHide={viewer?.isAdmin === true}
              />
            ))}
        </ul>
      )}
    </section>
  );
}

function ReviewItem({ review, canHide }: { review: Review; canHide: boolean }) {
  const t = useTranslations("Reviews");
  const format = useFormatter();
  const name = review.authorName || t("anonymous");

  return (
    <li className="flex gap-3">
      <Avatar
        name={name}
        url={review.authorAvatar}
        className="size-9 text-sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold">{name}</span>
          <span className="text-xs text-muted-foreground">
            {format.dateTime(new Date(review.updatedAt), {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <Stars
          rating={review.rating}
          label={t("outOf5", { rating: review.rating })}
          className="mt-0.5"
        />
        {review.body && (
          <p className="mt-1 text-sm whitespace-pre-line">{review.body}</p>
        )}
        {canHide && (
          <form
            action={hideReviewAction}
            onSubmit={(e) => {
              if (!window.confirm(t("hideConfirm"))) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={review.id} />
            <button
              type="submit"
              className="mt-1 inline-flex h-9 items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              <EyeOff className="size-3.5" aria-hidden />
              {t("hide")}
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

function Composer({
  viewer,
  mine,
  onChange,
  targetType,
  targetId,
}: {
  viewer: Viewer | undefined;
  mine: MyReview | null;
  onChange: (review: MyReview | null) => void;
  targetType: ReviewTargetType;
  targetId: string;
}) {
  const t = useTranslations("Reviews");
  // The real path (e.g. /en/pasar/seksyen-7), to come back after logging in.
  const here = usePathname();
  const [editing, setEditing] = useState(false);

  if (viewer === undefined) return <div className="h-20" />;

  if (viewer === null) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border bg-card p-4">
        <p className="text-sm">{t("signInPrompt")}</p>
        <Button asChild variant="outline" className="h-11 px-4">
          <Link href={{ pathname: "/login", query: { next: here } }}>
            {t("signIn")}
          </Link>
        </Button>
      </div>
    );
  }

  if (mine && !editing) {
    return (
      <div className="space-y-2 border-2 border-pasar/60 bg-card p-4">
        <p className="text-xs font-bold tracking-wide text-pasar-text uppercase">
          {t("yours")}
        </p>
        <Stars
          rating={mine.rating}
          label={t("outOf5", { rating: mine.rating })}
        />
        {mine.body && (
          <p className="text-sm whitespace-pre-line">{mine.body}</p>
        )}
        {mine.status === "hidden" && (
          <p className="text-sm text-muted-foreground">{t("hiddenNote")}</p>
        )}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEditing(true)}
            className="h-10 gap-1.5 px-3"
          >
            <Pencil className="size-4" aria-hidden />
            {t("edit")}
          </Button>
          <form
            action={async (formData) => {
              await deleteReviewAction(formData);
              onChange(null);
            }}
            onSubmit={(e) => {
              if (!window.confirm(t("deleteConfirm"))) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={mine.id} />
            <Button
              type="submit"
              variant="ghost"
              className="h-10 gap-1.5 px-3 hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden />
              {t("delete")}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <ReviewForm
      targetType={targetType}
      targetId={targetId}
      mine={mine}
      onSaved={(review) => {
        onChange(review);
        setEditing(false);
      }}
      onCancel={mine ? () => setEditing(false) : undefined}
    />
  );
}

function ReviewForm({
  targetType,
  targetId,
  mine,
  onSaved,
  onCancel,
}: {
  targetType: ReviewTargetType;
  targetId: string;
  mine: MyReview | null;
  onSaved: (review: MyReview) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("Reviews");
  const [state, formAction, pending] = useActionState<
    ReviewFormState,
    FormData
  >(saveReviewAction, {});
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(mine?.body ?? "");

  useEffect(() => {
    if (state.saved) onSaved(state.saved);
  }, [state, onSaved]);

  const shown = hover || rating;

  return (
    <form action={formAction} className="space-y-3 border bg-card p-4">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />

      <fieldset>
        <legend className="text-sm font-semibold">{t("yourRating")}</legend>
        <div className="mt-1 flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              onMouseEnter={() => setHover(n)}
              className="flex size-11 cursor-pointer items-center justify-center has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="sr-only"
              />
              <span className="sr-only">{t("stars", { count: n })}</span>
              <Star
                aria-hidden
                className={cn(
                  "size-8 transition-colors",
                  n <= shown
                    ? "fill-pasar text-pasar"
                    : "fill-transparent text-border",
                )}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1">
        <label htmlFor={`review-${targetId}`} className="text-sm font-semibold">
          {t("bodyLabel")}{" "}
          <span className="font-normal text-muted-foreground">
            ({t("optional")})
          </span>
        </label>
        <textarea
          id={`review-${targetId}`}
          name="body"
          rows={3}
          maxLength={REVIEW_MAX}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t(
            targetType === "pasar"
              ? "bodyPlaceholderPasar"
              : "bodyPlaceholderVendor",
          )}
          className="w-full border bg-background px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-right text-xs text-muted-foreground">
          {body.length}/{REVIEW_MAX}
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={pending || rating === 0}
          className="h-11 bg-cta px-5 font-bold text-on-cta hover:bg-cta/90"
        >
          {pending ? t("posting") : mine ? t("save") : t("post")}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-11 px-4"
          >
            {t("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
