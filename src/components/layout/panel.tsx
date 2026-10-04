import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PanelHeader({
  eyebrow,
  title,
  subtitle,
  section = "pasar",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  section?: "pasar" | "kedai";
}) {
  return (
    <div className="px-4 pt-4 pb-3 lg:px-6 lg:pt-6">
      {eyebrow && (
        <p
          className={cn(
            "mb-1 text-xs font-bold tracking-wide uppercase",
            section === "pasar" ? "text-pasar-text" : "text-kedai",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

export function PanelBody({ children }: { children: ReactNode }) {
  return <div className="px-4 pb-6 lg:px-6">{children}</div>;
}

/** Dashed box marking where a later part's content goes. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
