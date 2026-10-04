import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Same look as <Input>, for <select> and <textarea>. */
export const CONTROL_CLASS =
  "w-full border bg-card px-4 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive";

/** Label + control + hint + error, wired up for screen readers. */
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  optionalLabel,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  optionalLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted-foreground">
            ({optionalLabel})
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** aria props for a control inside <Field>. */
export function describedBy(id: string, hint?: string, error?: string) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": ids.length ? ids.join(" ") : undefined,
  } as const;
}

export function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("space-y-4 border bg-card p-4", className)}>
      <legend className="px-1 text-sm font-extrabold">{title}</legend>
      {children}
    </fieldset>
  );
}
