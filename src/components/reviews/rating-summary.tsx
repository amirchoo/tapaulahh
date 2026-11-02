import { getFormatter, getTranslations } from "next-intl/server";
import type { ReviewSummary } from "@/lib/reviews/types";
import { Stars } from "./stars";

/** Link to reviews, with outlined stars and an explicit label when unrated. */
export async function RatingSummary({ summary }: { summary: ReviewSummary }) {
  const t = await getTranslations("Reviews");
  const format = await getFormatter();
  const average =
    summary.average === null
      ? null
      : format.number(summary.average, { maximumFractionDigits: 1 });

  return (
    <a
      href="#ulasan"
      aria-label={average === null ? t("notRated") : undefined}
      className="inline-flex min-h-11 flex-wrap items-center gap-1.5 text-sm font-semibold outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Stars
        rating={summary.average ?? 0}
        label={
          average === null ? t("notRated") : t("outOf5", { rating: average })
        }
      />
      {average === null ? (
        <span className="font-normal text-muted-foreground">
          {t("notRated")}
        </span>
      ) : (
        <>
          {average}
          <span className="font-normal text-muted-foreground">
            · {t("count", { count: summary.count })}
          </span>
        </>
      )}
    </a>
  );
}
