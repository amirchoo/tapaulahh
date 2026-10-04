import { ChevronLeft } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

export function BackLink({
  href,
  children,
}: {
  href: ComponentProps<typeof Link>["href"];
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex h-11 items-center gap-1 px-2 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ChevronLeft className="size-4" aria-hidden />
      {children}
    </Link>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "muted" | "pending";
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        tone === "pending"
          ? "bg-pasar/20 px-1.5 py-0.5 text-xs font-bold text-pasar-text"
          : "bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground"
      }
    >
      {children}
    </span>
  );
}
