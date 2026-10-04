"use client";

import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { googleAction, loginAction, type LoginState } from "@/lib/auth/actions";
import { NAME_MAX, PASSWORD_MIN } from "@/lib/auth/profile-name";
import { PasswordInput } from "./password-input";

/** Supabase lets you ask for a new code once a minute. */
const RESEND_SECONDS = 60;

const CTA_CLASS =
  "h-12 w-full bg-cta text-base font-bold text-on-cta hover:bg-cta/90";

export type AuthMode = "login" | "signup" | "forgot";

/**
 * - signup: name + email + password, then the code we email to confirm it.
 * - login: email + password, or "email me a code" for people without one.
 * - forgot: email, then a code, then /akaun/kata-laluan to pick a new one.
 */
export function LoginForm({
  mode,
  next,
  googleEnabled,
  confirmsEmail,
  urlError,
}: {
  mode: AuthMode;
  next: string | null;
  googleEnabled: boolean;
  /** Off while Supabase has email confirmation switched off. */
  confirmsEmail: boolean;
  /** From ?error= after a failed email link or Google sign-in. */
  urlError: "link" | "google" | null;
}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {
      step: "form",
      purpose:
        mode === "forgot" ? "recovery" : mode === "signup" ? "signup" : "login",
      email: "",
      name: "",
    },
  );
  // Log in: with a password (default), or with a code sent by email.
  const [useCode, setUseCode] = useState(false);
  const untouched = state.step === "form" && !state.email && !state.error;

  const nextInput = next && <input type="hidden" name="next" value={next} />;

  if (state.step === "code") {
    return (
      <div className="space-y-5">
        <div className="flex gap-3 border bg-card p-4">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-open" aria-hidden />
          <div className="text-sm">
            <p className="font-bold">{t(`code.${state.purpose}.title`)}</p>
            <p className="mt-1 text-muted-foreground">
              {t(`code.${state.purpose}.body`, { email: state.email })}
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-3">
          {nextInput}
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="name" value={state.name} />
          <input type="hidden" name="purpose" value={state.purpose} />

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
            {pending ? t("verifying") : t(`code.${state.purpose}.submit`)}
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

  const intent =
    mode === "signup"
      ? "signup"
      : mode === "forgot"
        ? "forgot"
        : useCode
          ? "send"
          : "password";
  const showPassword = intent === "signup" || intent === "password";
  const submitLabel = {
    signup: t("signupSubmit"),
    password: t("loginSubmit"),
    send: t("sendCode"),
    forgot: t("sendResetCode"),
  }[intent];

  return (
    <div className="space-y-5">
      {untouched && urlError && (
        <p
          role="alert"
          className="border border-destructive/40 p-3 text-sm text-destructive"
        >
          {t(`errors.${urlError}`)}
        </p>
      )}

      {googleEnabled && mode !== "forgot" && (
        <>
          <form action={googleAction}>
            {nextInput}
            <Button
              type="submit"
              variant="outline"
              className="h-12 w-full text-base font-semibold"
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

      <form action={formAction} className="space-y-4">
        {nextInput}
        <input type="hidden" name="intent" value={intent} />

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
            autoComplete={mode === "signup" ? "email" : "username"}
            inputMode="email"
            defaultValue={state.email}
            placeholder={t("emailPlaceholder")}
            aria-invalid={
              state.error === "invalidEmail" || state.error === "emailTaken"
                ? true
                : undefined
            }
            aria-describedby={state.error ? "login-error" : undefined}
          />
        </div>

        {showPassword && (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor="password" className="block text-sm font-semibold">
                {t("passwordLabel")}
              </label>
              {mode === "login" && (
                <Link
                  href={{
                    pathname: "/lupa-kata-laluan",
                    query: next ? { next } : {},
                  }}
                  className="text-sm font-semibold underline underline-offset-4"
                >
                  {t("forgotLink")}
                </Link>
              )}
            </div>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={mode === "signup" ? PASSWORD_MIN : undefined}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              aria-invalid={
                state.error === "passwordShort" ||
                state.error === "wrongPassword"
                  ? true
                  : undefined
              }
              aria-describedby={mode === "signup" ? "password-hint" : undefined}
            />
            {mode === "signup" && (
              <p id="password-hint" className="text-xs text-muted-foreground">
                {t("passwordHint", { min: PASSWORD_MIN })}
              </p>
            )}
          </div>
        )}

        <FormMessage state={state} />

        <Button type="submit" disabled={pending} className={CTA_CLASS}>
          {pending ? t("sending") : submitLabel}
        </Button>

        {mode === "signup" && confirmsEmail && (
          <p className="text-xs text-muted-foreground">
            {t("signupExplainer")}
          </p>
        )}
        {mode === "forgot" && (
          <p className="text-xs text-muted-foreground">
            {t("forgotExplainer")}
          </p>
        )}
        {mode === "login" && (
          <button
            type="button"
            onClick={() => setUseCode((v) => !v)}
            className="h-11 text-sm font-semibold underline underline-offset-4"
          >
            {useCode ? t("usePassword") : t("useCode")}
          </button>
        )}
      </form>

      <p className="text-sm">
        {mode === "signup" ? t("haveAccount") : t("noAccount")}{" "}
        <Link
          href={{
            pathname: mode === "signup" ? "/login" : "/daftar",
            query: next ? { next } : {},
          }}
          className="font-bold underline underline-offset-4"
        >
          {mode === "signup" ? t("loginLink") : t("signupLink")}
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
