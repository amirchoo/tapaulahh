"use client";

import { useLocale, useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { saveVendorAction, type AdminFormState } from "@/lib/admin/actions";
import type { AdminVendor } from "@/lib/admin/queries";
import { WEEK } from "@/lib/pasar/schedule";
import type { VendorCategory } from "@/lib/pasar/types";
import { photoFolder } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { CONTROL_CLASS, Field, FormSection, describedBy } from "./fields";
import { SaveBar } from "./pasar-form";
import { PhotoUploader } from "./photo-uploader";

/** Add or edit a stall at a pasar. */
export function VendorForm({
  id,
  pasarId,
  vendor,
  categories,
  pasarDays,
}: {
  id: string;
  pasarId: string;
  vendor: AdminVendor | null;
  categories: VendorCategory[];
  /** New stalls start with the pasar's own days ticked. */
  pasarDays: number[];
}) {
  const t = useTranslations("Admin");
  const tDays = useTranslations("Days");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    saveVendorAction,
    {},
  );
  const [uploading, setUploading] = useState(false);
  const fe = state.fieldErrors ?? {};
  const err = (name: string) =>
    fe[name] ? t(`fieldErrors.${fe[name]}`) : undefined;
  const usualDays = vendor?.usual_days ?? pasarDays;

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
      <input type="hidden" name="pasarId" value={pasarId} />
      <input type="hidden" name="isNew" value={vendor ? "0" : "1"} />

      <FormSection title={t("vendorForm.basics")}>
        <Field id="name" label={t("vendorForm.name")} error={err("name")}>
          <Input
            id="name"
            name="name"
            required
            maxLength={120}
            defaultValue={vendor?.name}
            placeholder={t("vendorForm.namePlaceholder")}
            {...describedBy("name", undefined, err("name"))}
          />
        </Field>
        <Field
          id="category_id"
          label={t("vendorForm.category")}
          error={err("category_id")}
        >
          <select
            id="category_id"
            name="category_id"
            defaultValue={vendor?.category_id ?? ""}
            className={cn(CONTROL_CLASS, "h-12")}
          >
            <option value="">{t("vendorForm.noCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === "en" ? c.nameEn : c.nameMs}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="description"
          label={t("vendorForm.description")}
          hint={t("vendorForm.descriptionHint")}
          optional
          optionalLabel={t("optional")}
        >
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={vendor?.description ?? ""}
            className={cn(CONTROL_CLASS, "py-3")}
            {...describedBy("description", "hint")}
          />
        </Field>
        <Field
          id="price_range"
          label={t("vendorForm.price")}
          optional
          optionalLabel={t("optional")}
        >
          <Input
            id="price_range"
            name="price_range"
            maxLength={60}
            defaultValue={vendor?.price_range ?? ""}
            placeholder={t("vendorForm.pricePlaceholder")}
          />
        </Field>
        <Field
          id="slug"
          label={t("slug")}
          hint={vendor ? t("slugHintEdit") : t("slugHint")}
          error={err("slug")}
          optional={!vendor}
          optionalLabel={t("optional")}
        >
          <Input
            id="slug"
            name="slug"
            maxLength={80}
            defaultValue={vendor?.slug}
            placeholder="apam-balik-pak-mat"
            autoCapitalize="none"
            spellCheck={false}
            {...describedBy("slug", "hint", err("slug"))}
          />
        </Field>
      </FormSection>

      <FormSection title={t("vendorForm.days")}>
        <p className="text-xs text-muted-foreground">
          {t("vendorForm.daysHint")}
        </p>
        <div className="flex flex-wrap gap-2">
          {WEEK.map((day) => (
            <label
              key={day}
              className="flex h-11 items-center gap-2 rounded-xl border px-3 font-semibold has-checked:border-pasar has-checked:bg-pasar/15"
            >
              <input
                type="checkbox"
                name="usual_days"
                value={day}
                defaultChecked={usualDays.includes(day)}
                className="size-5 accent-pasar"
              />
              {tDays(`short.${day}`)}
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection title={t("photos.title")}>
        <PhotoUploader
          folder={photoFolder("vendors", id)}
          initial={vendor?.photos ?? []}
          onBusyChange={setUploading}
        />
      </FormSection>

      <FormSection title={t("visibility")}>
        <div className="space-y-2">
          {(["active", "pending", "inactive"] as const).map((value) => (
            <label key={value} className="flex min-h-11 items-start gap-3 py-1">
              <input
                type="radio"
                name="status"
                value={value}
                defaultChecked={(vendor?.status ?? "active") === value}
                className="mt-1 size-5 accent-pasar"
              />
              <span>
                <span className="block font-semibold">
                  {t(`vendorStatus.${value}`)}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {t(`vendorStatus.${value}Hint`)}
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
        label={vendor ? t("saveChanges") : t("vendorForm.create")}
      />
    </form>
  );
}
