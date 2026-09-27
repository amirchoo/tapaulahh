import type { ReactNode } from "react";

/** Single-column layout for account, login and admin pages. */
export function ContentPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 lg:py-12">
      <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}
