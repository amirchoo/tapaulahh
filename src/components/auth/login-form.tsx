"use client";

import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { googleAction, loginAction, type LoginState } from "@/lib/auth/actions";
import { NAME_MAX } from "@/lib/auth/profile-name";

/** Supabase lets you ask for a new code once a minute. */
const RESEND_SECONDS = 60;

const CTA_CLASS =
  "h-12 w-full rounded-xl bg-cta text-base font-bold text-on-cta hover:bg-cta/90";

/**
 * Log in and sign up are the same flow: email → code from the email → in.
 * An email with no account yet gets one. Sign-up mode also asks for a name.
 */
export function LoginForm({
  mode,
  next,
  googleEnabled,
  urlError,
}: {
  mode: "login" | "signup";
  next: string | null;
  googleEnabled: boolean;
  /** From ?error= after a failed email link or Google sign-in. */
  urlError: "link" | "google" | null;
}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    { step: "email", email: "", name: "" },
  );
  const untouched = state.step === "email" && !state.email && !state.error;

  const hidden = (
    <>
      <input type="hidden" name="mode" value={mode} />
      {next && <input type="hidden" name="next" value={next} />}
    </>
  );

  if (state.step === "code") {
    return (
      <div className="space-y-5">
        <div className="flex gap-3 rounded-xl border bg-card p-4">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-open" aria-hidden />
          <div className="text-sm">
            <p className="font-bold">{t("codeTitle")}</p>
            <p className="mt-1 text-muted-foreground">
              {t("codeSent", { email: state.email })}
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-3">
          {hidden}
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="name" value={state.name} />

          <label htmlFor="code" className="block text-sm font-semibold">
            {t("codeLabel")}
          </label>
          <Input
            id="code"
            name="code"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={10}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "login-error" : undefined}
            className="text-center text-2xl font-bold tracking-[0.4em]"
          />
          <FormMessage state={state} />

          <Button
            type="submit"
            name="intent"
            value="verify"
            disabled={pending}
            className={CTA_CLASS}
          >
            {pending ? t("verifying") : t("verify")}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              type="submit"
              name="intent"
              value="change"
              formNoValidate
              variant="ghost"
              disabled={pending}
              className="h-11 px-3"
            >
              {t("changeEmail")}
            </Button>
            <ResendButton key={state.sentAt} disabled={pending} />
          </div>
          <p className="text-sm text-muted-foreground">{t("spamHint")}</p>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {untouched && urlError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive"
        >
          {t(`errors.${urlError}`)}
        </p>
      )}

      {googleEnabled && (
        <>
          <form action={googleAction}>
            {hidden}
            <Button
              type="submit"
              variant="outline"
              className="h-12 w-full rounded-xl text-base font-semibold"
            >
              {t("google")}
            </Button>
          </form>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form action={formAction} className="space-y-3">
        {hidden}
        <input type="hidden" name="intent" value="send" />

        {mode === "signup" && (
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-semibold">
              {t("nameLabel")}
            </label>
            <Input
              id="name"
              name="name"
              required
              autoComplete="name"
              maxLength={NAME_MAX}
              defaultValue={state.name}
              placeholder={t("namePlaceholder")}
              aria-invalid={state.error === "nameRequired" ? true : undefined}
              aria-describedby="name-hint"
            />
            <p id="name-hint" className="text-xs text-muted-foreground">
              {t("nameHint")}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-semibold">
            {t("emailLabel")}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            defaultValue={state.email}
            placeholder={t("emailPlaceholder")}
            aria-invalid={state.error === "invalidEmail" ? true : undefined}
            aria-describedby={state.error ? "login-error" : undefined}
          />
        </div>
        <FormMessage state={state} />

        <Button type="submit" disabled={pending} className={CTA_CLASS}>
          {pending ? t("sending") : t("sendCode")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("codeExplainer")}</p>
      </form>

      <p className="text-sm">
        {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
        <Link
          href={{
            pathname: mode === "login" ? "/daftar" : "/login",
            query: next ? { next } : {},
          }}
          className="font-bold underline underline-offset-4"
        >
          {mode === "login" ? t("signupLink") : t("loginLink")}
        </Link>
      </p>
    </div>
  );
}

function FormMessage({ state }: { state: LoginState }) {
  const t = useTranslations("Auth");
  if (state.error) {
    return (
      <p id="login-error" role="alert" className="text-sm text-destructive">
        {t(`errors.${state.error}`)}
      </p>
    );
  }
  if (state.resent) {
    return (
      <p role="status" className="text-sm text-open">
        {t("resent")}
      </p>
    );
  }
  return null;
}

/** Remounted (via key) each time a code is sent, which restarts the wait. */
function ResendButton({ disabled }: { disabled: boolean }) {
  const t = useTranslations("Auth");
  const [left, setLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  return (
    <Button
      type="submit"
      name="intent"
      value="resend"
      formNoValidate
      variant="ghost"
      disabled={disabled || left > 0}
      className="h-11 px-3"
    >
      {left > 0 ? t("resendIn", { seconds: left }) : t("resend")}
    </Button>
  );
}
