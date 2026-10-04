"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { setPasswordAction, type PasswordState } from "@/lib/auth/actions";
import { PASSWORD_MIN } from "@/lib/auth/profile-name";
import { PasswordInput } from "./password-input";

/** New password + confirm, for "forgot password" and My account. */
export function PasswordForm({ next }: { next?: string }) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(
    setPasswordAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-semibold">
          {t("newPasswordLabel")}
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={PASSWORD_MIN}
          autoComplete="new-password"
          autoFocus
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          {t("passwordHint", { min: PASSWORD_MIN })}
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="block text-sm font-semibold">
          {t("confirmPasswordLabel")}
        </label>
        <PasswordInput
          id="confirm"
          name="confirm"
          required
          autoComplete="new-password"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-cta text-base font-bold text-on-cta hover:bg-cta/90"
      >
        {pending ? t("saving") : t("savePassword")}
      </Button>
    </form>
  );
}
