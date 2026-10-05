"use client";

import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import {
  CONTROL_CLASS,
  Field,
  FormSection,
  describedBy,
} from "@/components/admin/fields";
import { SaveBar } from "@/components/admin/pasar-form";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { Input } from "@/components/ui/input";
import type { AdminFormState } from "@/lib/admin/actions";
import { formatWhatsapp } from "@/lib/kedai/contact";
import { saveBusinessAction } from "@/lib/kedai/actions";
import type { OwnerBusiness } from "@/lib/kedai/owner";
import type { BusinessCategory } from "@/lib/kedai/types";
import { MALAYSIAN_STATES } from "@/lib/pasar/states";
import { BUSINESS_PHOTOS_BUCKET } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * Register a Peniaga Kecil business, or edit it. `id` is made up front for
 * new ones; `userId` is the owner's Storage folder (their only writable one).
 */
export function BusinessForm({
  id,
  userId,
  business,
  categories,
}: {
  id: string;
  userId: string;
  business: OwnerBusiness | null;
  categories: BusinessCategory[];
}) {
  const t = useTranslations("BusinessForm");
  const tAdmin = useTranslations("Admin");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    saveBusinessAction,
    {},
  );
  const [uploading, setUploading] = useState(false);
  const fe = state.fieldErrors ?? {};
  const err = (name: string) =>
    fe[name] ? tAdmin(`fieldErrors.${fe[name]}`) : undefined;
  const optional = { optional: true, optionalLabel: tAdmin("optional") };

  const submitLabel = !business
    ? t("submitNew")
    : business.status === "rejected"
      ? t("submitResubmit")
      : t("submitSave");

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
      <input type="hidden" name="isNew" value={business ? "0" : "1"} />

      <FormSection title={t("aboutTitle")}>
        <Field id="name" label={t("name")} error={err("name")}>
          <Input
            id="name"
            name="name"
            required
            maxLength={120}
            defaultValue={business?.name}
            placeholder={t("namePlaceholder")}
            {...describedBy("name", undefined, err("name"))}
          />
        </Field>
        <Field
          id="category_id"
          label={t("category")}
          error={err("category_id")}
        >
          <select
            id="category_id"
            name="category_id"
            defaultValue={business?.category_id ?? ""}
            className={cn(CONTROL_CLASS, "h-12")}
            {...describedBy("category_id", undefined, err("category_id"))}
          >
            <option value="" disabled>
              {t("categoryPick")}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === "en" ? c.nameEn : c.nameMs}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="description"
          label={t("description")}
          hint={t("descriptionHint")}
          {...optional}
        >
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={business?.description ?? ""}
            className={cn(CONTROL_CLASS, "py-3")}
            {...describedBy("description", "hint")}
          />
        </Field>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">{t("logo")}</p>
          <PhotoUploader
            folder={`${userId}/logo`}
            initial={business?.logo_url ? [business.logo_url] : []}
            onBusyChange={setUploading}
            max={1}
            name="logo"
            bucket={BUSINESS_PHOTOS_BUCKET}
          />
        </div>
      </FormSection>

      <FormSection title={t("contactTitle")}>
        <p className="text-xs text-muted-foreground">{t("contactHint")}</p>
        <Field
          id="whatsapp"
          label={t("whatsapp")}
          hint={t("whatsappHint")}
          error={err("whatsapp")}
        >
          <Input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={
              business?.whatsapp ? formatWhatsapp(business.whatsapp) : ""
            }
            placeholder="012-345 6789"
            {...describedBy("whatsapp", "hint", err("whatsapp"))}
          />
        </Field>
        <Field
          id="instagram"
          label={t("instagram")}
          error={err("instagram")}
          {...optional}
        >
          <Input
            id="instagram"
            name="instagram"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={business?.instagram ? `@${business.instagram}` : ""}
            placeholder="@kedaianda"
            {...describedBy("instagram", undefined, err("instagram"))}
          />
        </Field>
        <Field id="hours" label={t("hours")} {...optional}>
          <Input
            id="hours"
            name="hours"
            maxLength={300}
            defaultValue={business?.hours ?? ""}
            placeholder={t("hoursPlaceholder")}
          />
        </Field>
        <Field id="delivery_notes" label={t("delivery")} {...optional}>
          <textarea
            id="delivery_notes"
            name="delivery_notes"
            rows={2}
            maxLength={500}
            defaultValue={business?.delivery_notes ?? ""}
            placeholder={t("deliveryPlaceholder")}
            className={cn(CONTROL_CLASS, "py-3")}
          />
        </Field>
      </FormSection>

      <FormSection title={t("areaTitle")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="district"
            label={t("district")}
            hint={t("districtHint")}
            error={err("district")}
          >
            <Input
              id="district"
              name="district"
              required
              maxLength={80}
              defaultValue={business?.district}
              placeholder="Shah Alam"
              {...describedBy("district", "hint", err("district"))}
            />
          </Field>
          <Field id="state" label={t("state")} error={err("state")}>
            <select
              id="state"
              name="state"
              defaultValue={business?.state ?? "Selangor"}
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
        <div className="flex gap-2 border bg-background p-3 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-kedai" aria-hidden />
          <p>{t("privacy")}</p>
        </div>
        <Field
          id="location"
          label={t("location")}
          hint={t("locationHint")}
          error={err("location")}
          {...optional}
        >
          <Input
            id="location"
            name="location"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={
              business?.location
                ? `${business.location.lat}, ${business.location.lng}`
                : ""
            }
            placeholder="https://maps.app.goo.gl/…"
            {...describedBy("location", "hint", err("location"))}
          />
        </Field>
        <Field
          id="address"
          label={t("address")}
          hint={t("addressHint")}
          {...optional}
        >
          <Input
            id="address"
            name="address"
            maxLength={300}
            defaultValue={business?.location?.address ?? ""}
            {...describedBy("address", "hint")}
          />
        </Field>
      </FormSection>

      <SaveBar
        pending={pending}
        uploading={uploading}
        state={state}
        label={submitLabel}
      />
    </form>
  );
}
