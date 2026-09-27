import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Text placeholder until the real logo arrives.
export function Wordmark({ className }: { className?: string }) {
  const t = useTranslations("Nav");

  return (
    <Link
      href="/"
      aria-label={t("home")}
      className={cn(
        "rounded-md text-xl font-extrabold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      tapau<span className="text-pasar-text">lahh</span>
    </Link>
  );
}
