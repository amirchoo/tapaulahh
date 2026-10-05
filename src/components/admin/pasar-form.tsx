"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminPasar } from "@/lib/admin/queries";
import { savePasarAction, type AdminFormState } from "@/lib/admin/actions";
import { googleMapsUrl } from "@/lib/geo/parse-location";
import { WEEK } from "@/lib/pasar/schedule";
import { MALAYSIAN_STATES } from "@/lib/pasar/states";
import { photoFolder } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { CONTROL_CLASS, Field, FormSection, describedBy } from "./fields";
import { PhotoUploader } from "./photo-uploader";

const DEFAULT_START = "17:00";
const DEFAULT_END = "22:00";

/**
 * Add or edit a pasar. `id` is generated up front for new pasars so photos
 * can be uploaded into its folder before the first save.
 */
export function PasarForm({
  id,
  pasar,
}: {
  id: string;
  pasar: AdminPasar | null;
}) {
  const t = useTranslations("Admin");
  const tDays = useTranslations("Days");
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    savePasarAction,
    {},
  );
  const [uploading, setUploading] = useState(false);
  const fe = state.fieldErrors ?? {};
  const err = (name: string) =>
    fe[name] ? t(`fieldErrors.${fe[name]}`) : undefined;

  const scheduleFor = (day: number) =>
    pasar?.schedules.find((s) => s.day_of_week === day);
  const [days, setDays] = useState(
    () => new Set(WEEK.filter((day) => scheduleFor(day))),
  );

  const location =
    pasar?.lat != null && pasar.lng != null
      ? { lat: pasar.lat, lng: pasar.lng }
      : null;

  return (
    <form
      // Submitted by hand so React doesn't clear the form when there's an error.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="space-y-6"
      noValidate
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isNew" value={pasar ? "0" : "1"} />

      <FormSection title={t("pasarForm.basics")}>
        <Field id="name" label={t("pasarForm.name")} error={err("name")}>
          <Input
            id="name"
            name="name"
            required
            maxLength={120}
            defaultValue={pasar?.name}
            placeholder={t("pasarForm.namePlaceholder")}
            {...describedBy("name", undefined, err("name"))}
          />
        </Field>
        <Field
          id="slug"
          label={t("slug")}
          hint={pasar ? t("slugHintEdit") : t("slugHint")}
          error={err("slug")}
          optional={!pasar}
          optionalLabel={t("optional")}
        >
          <Input
            id="slug"
            name="slug"
            maxLength={80}
            defaultValue={pasar?.slug}
            placeholder="pasar-malam-seksyen-7"
            autoCapitalize="none"
            spellCheck={false}
            {...describedBy("slug", "hint", err("slug"))}
          />
        </Field>
        <Field
          id="description"
          label={t("pasarForm.description")}
          hint={t("pasarForm.descriptionHint")}
          optional
          optionalLabel={t("optional")}
        >
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={pasar?.description ?? ""}
            className={cn(CONTROL_CLASS, "py-3")}
            {...describedBy("description", "hint")}
          />
        </Field>
      </FormSection>

      <FormSection title={t("pasarForm.where")}>
        <Field
          id="location"
          label={t("pasarForm.location")}
          hint={t("pasarForm.locationHint")}
          error={err("location")}
        >
          <Input
            id="location"
            name="location"
            required
            defaultValue={location ? `${location.lat}, ${location.lng}` : ""}
            placeholder="https://maps.app.goo.gl/…"
            autoCapitalize="none"
            spellCheck={false}
            {...describedBy("location", "hint", err("location"))}
          />
        </Field>
        {location && (
          <a
            href={googleMapsUrl(location)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4"
          >
            {t("pasarForm.checkOnMap")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
        <Field
          id="address"
          label={t("pasarForm.address")}
          optional
          optionalLabel={t("optional")}
        >
          <Input
            id="address"
            name="address"
            maxLength={300}
            defaultValue={pasar?.address ?? ""}
            placeholder={t("pasarForm.addressPlaceholder")}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="district"
            label={t("pasarForm.district")}
            hint={t("pasarForm.districtHint")}
            error={err("district")}
          >
            <Input
              id="district"
              name="district"
              required
              maxLength={80}
              defaultValue={pasar?.district}
              placeholder="Shah Alam"
              {...describedBy("district", "hint", err("district"))}
            />
          </Field>
          <Field id="state" label={t("pasarForm.state")} error={err("state")}>
            <select
              id="state"
              name="state"
              defaultValue={pasar?.state ?? "Selangor"}
              className={cn(CONTROL_CLASS, "h-12")}
            >
              {MALAYSIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          id="parking_notes"
          label={t("pasarForm.parking")}
          optional
          optionalLabel={t("optional")}
        >
          <textarea
            id="parking_notes"
            name="parking_notes"
            rows={2}
            defaultValue={pasar?.parking_notes ?? ""}
            placeholder={t("pasarForm.parkingPlaceholder")}
            className={cn(CONTROL_CLASS, "py-3")}
          />
        </Field>
      </FormSection>

      <FormSection title={t("pasarForm.when")}>
        <p className="text-xs text-muted-foreground">
          {t("pasarForm.whenHint")}
        </p>
        <ul className="divide-y">
          {WEEK.map((day) => {
            const on = days.has(day);
            const saved = scheduleFor(day);
            return (
              <li
                key={day}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2"
              >
                <label className="flex h-11 min-w-28 items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    name={`day_${day}`}
                    checked={on}
                    onChange={(e) =>
                      setDays((set) => {
                        const next = new Set(set);
                        if (e.target.checked) next.add(day);
                        else next.delete(day);
                        return next;
                      })
                    }
                    className="size-5 accent-pasar"
                  />
                  {tDays(`long.${day}`)}
                </label>
                <div
                  className={cn("flex items-center gap-2", !on && "opacity-40")}
                >
                  <input
                    type="time"
                    name={`start_${day}`}
                    aria-label={t("pasarForm.opens", {
                      day: tDays(`long.${day}`),
                    })}
                    defaultValue={
                      saved?.start_time.slice(0, 5) ?? DEFAULT_START
                    }
                    disabled={!on}
                    className={cn(CONTROL_CLASS, "h-11 w-32 px-3")}
                  />
                  <span aria-hidden className="text-sm text-muted-foreground">
                    {t("pasarForm.timeTo")}
                  </span>
                  <input
                    type="time"
                    name={`end_${day}`}
                    aria-label={t("pasarForm.closes", {
                      day: tDays(`long.${day}`),
                    })}
                    defaultValue={saved?.end_time.slice(0, 5) ?? DEFAULT_END}
                    disabled={!on}
                    className={cn(CONTROL_CLASS, "h-11 w-32 px-3")}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {fe.schedule && (
          <p role="alert" className="text-sm text-destructive">
            {t(`fieldErrors.${fe.schedule}`)}
          </p>
        )}
      </FormSection>

      <FormSection title={t("photos.title")}>
        <PhotoUploader
          folder={photoFolder("pasars", id)}
          initial={pasar?.photos ?? []}
          onBusyChange={setUploading}
        />
      </FormSection>

      <FormSection title={t("visibility")}>
        <div className="space-y-2">
          {(["active", "inactive"] as const).map((value) => (
            <label key={value} className="flex min-h-11 items-start gap-3 py-1">
              <input
                type="radio"
                name="status"
                value={value}
                defaultChecked={(pasar?.status ?? "active") === value}
                className="mt-1 size-5 accent-pasar"
              />
              <span>
                <span className="block font-semibold">
                  {t(`pasarStatus.${value}`)}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {t(`pasarStatus.${value}Hint`)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </FormSection>

      <SaveBar
        pending={pending}
        uploading={uploading}
        state={state}
        label={pasar ? t("saveChanges") : t("pasarForm.create")}
      />
    </form>
  );
}

/** Save button + result message, shared by the pasar and stall forms. */
export function SaveBar({
  pending,
  uploading,
  state,
  label,
}: {
  pending: boolean;
  uploading: boolean;
  state: AdminFormState;
  label: string;
}) {
  const t = useTranslations("Admin");
  const hasFieldErrors = Object.keys(state.fieldErrors ?? {}).length > 0;

  return (
    <div className="space-y-2">
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}
      {hasFieldErrors && !pending && (
        <p role="alert" className="text-sm text-destructive">
          {t("errors.checkFields")}
        </p>
      )}
      {state.saved && !pending && (
        <p role="status" className="text-sm text-open">
          {t("saved")}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending || uploading}
        className="h-12 w-full bg-cta text-base font-bold text-on-cta hover:bg-cta/90 sm:w-auto sm:px-8"
      >
        {pending ? t("saving") : uploading ? t("photos.uploading") : label}
      </Button>
    </div>
  );
}
