"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveNameAction, type NameState } from "@/lib/auth/actions";
import { NAME_MAX } from "@/lib/auth/profile-name";
import { cn } from "@/lib/utils";

/**
 * Sets profiles.display_name. With `next` (welcome step) it continues there
 * after saving; without it (My account) it stays and says "saved".
 */
export function NameForm({
  defaultName,
  next,
  submitLabel,
  primary = false,
}: {
  defaultName: string;
  next?: string;
  submitLabel: string;
  /** Use the CTA style (welcome step) instead of a quiet button. */
  primary?: boolean;
}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState<NameState, FormData>(
    saveNameAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-1.5">
        <label htmlFor="display-name" className="block text-sm font-semibold">
          {t("nameLabel")}
        </label>
        <Input
          id="display-name"
          name="name"
          required
          autoComplete="name"
          maxLength={NAME_MAX}
          defaultValue={defaultName}
          placeholder={t("namePlaceholder")}
          aria-invalid={state.error ? true : undefined}
          aria-describedby="display-name-hint"
        />
        <p id="display-name-hint" className="text-xs text-muted-foreground">
          {t("nameHint")}
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}
      {state.saved && !pending && (
        <p role="status" className="text-sm text-open">
          {t("saved")}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        variant={primary ? "default" : "outline"}
        className={cn(
          "h-12 px-6 text-base font-bold",
          primary && "w-full bg-cta text-on-cta hover:bg-cta/90",
        )}
      >
        {pending ? t("saving") : submitLabel}
      </Button>
    </form>
  );
}
