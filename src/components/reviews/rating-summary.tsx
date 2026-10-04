import { getFormatter, getTranslations } from "next-intl/server";
import type { ReviewSummary } from "@/lib/reviews/types";
import { Stars } from "./stars";

/** "★★★★☆ 4.3 · 12 ulasan", linking down to the reviews. Nothing if none yet. */
export async function RatingSummary({ summary }: { summary: ReviewSummary }) {
  if (summary.average === null) return null;
  const t = await getTranslations("Reviews");
  const format = await getFormatter();
  const average = format.number(summary.average, { maximumFractionDigits: 1 });

  return (
    <a
      href="#ulasan"
      className="inline-flex items-center gap-1.5 text-sm font-semibold outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Stars
        rating={summary.average}
        label={t("outOf5", { rating: average })}
      />
      {average}
      <span className="font-normal text-muted-foreground">
        · {t("count", { count: summary.count })}
      </span>
    </a>
  );
}
