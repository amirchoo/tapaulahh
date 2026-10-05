"use client";

import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { startTransition, useActionState, useEffect, useState } from "react";
import { formatPrice } from "@/components/pasar/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminFormState } from "@/lib/admin/actions";
import type { PhotoBucket } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { CONTROL_CLASS, Field, describedBy } from "./fields";
import { PhotoUploader } from "./photo-uploader";

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_rm: number | null;
  photo_url: string | null;
  is_available: boolean;
};

/** Server actions for one kind of list (a stall's menu, a shop's catalog). */
export type MenuActions = {
  save: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  remove: (formData: FormData) => Promise<void>;
  move: (formData: FormData) => Promise<void>;
};

type Ctx = {
  parentId: string;
  actions: MenuActions;
  /** Item photos go in `${photoBase}/<item id>/`. */
  photoBase: string;
  bucket: PhotoBucket;
  /** "Admin.menu" for stalls (food), "Catalog" for Peniaga Kecil (any product). */
  ns: "Admin.menu" | "Catalog";
};

/**
 * A list of things for sale: add, edit, reorder, delete, one open at a time.
 * Used for a stall's menu (admin) and a Peniaga Kecil catalog (owner).
 */
export function MenuEditor({ items, ...ctx }: Ctx & { items: MenuItem[] }) {
  const t = useTranslations(ctx.ns);
  // An item id, "new", or nothing open.
  const [open, setOpen] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const close = () => setOpen(null);

  return (
    <div className="space-y-3">
      {items.length === 0 && open !== "new" && (
        <p className="border border-dashed p-4 text-sm text-muted-foreground">
          {t("empty")}
        </p>
      )}
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, i) =>
            open === item.id ? (
              <li key={item.id}>
                <ItemForm id={item.id} ctx={ctx} item={item} onDone={close} />
              </li>
            ) : (
              <ItemRow
                key={item.id}
                item={item}
                ctx={ctx}
                isFirst={i === 0}
                isLast={i === items.length - 1}
                onEdit={() => setOpen(item.id)}
              />
            ),
          )}
        </ul>
      )}
      {open === "new" && newId ? (
        <ItemForm key={newId} id={newId} ctx={ctx} item={null} onDone={close} />
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setNewId(crypto.randomUUID());
            setOpen("new");
          }}
          className="h-11 gap-1.5 px-4 font-semibold"
        >
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </Button>
      )}
    </div>
  );
}

function ItemRow({
  item,
  ctx,
  isFirst,
  isLast,
  onEdit,
}: {
  item: MenuItem;
  ctx: Ctx;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
}) {
  const { parentId, actions } = ctx;
  const t = useTranslations(ctx.ns);
  const locale = useLocale();
  const ids = (
    <>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="parentId" value={parentId} />
    </>
  );
  const iconButton =
    "flex size-10 items-center justify-center text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30";

  return (
    <li
      className={cn(
        "flex gap-3 border bg-card p-2",
        !item.is_available && "opacity-60",
      )}
    >
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden bg-muted">
        {item.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo_url} alt="" className="size-full object-cover" />
        ) : (
          <UtensilsCrossed
            className="size-6 text-muted-foreground"
            aria-hidden
          />
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="font-bold">
          {item.name}
          {!item.is_available && (
            <span className="ml-2 bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground">
              {t("soldOut")}
            </span>
          )}
        </p>
        <p className="text-sm font-semibold text-pasar-text">
          {item.price_rm != null
            ? formatPrice(item.price_rm, locale)
            : t("noPrice")}
        </p>
        {item.description && (
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between sm:flex-row sm:items-center">
        <div className="flex">
          <form action={actions.move}>
            {ids}
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              disabled={isFirst}
              aria-label={t("moveUp", { name: item.name })}
              className={iconButton}
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
          </form>
          <form action={actions.move}>
            {ids}
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              disabled={isLast}
              aria-label={t("moveDown", { name: item.name })}
              className={iconButton}
            >
              <ArrowDown className="size-4" aria-hidden />
            </button>
          </form>
        </div>
        <div className="flex">
          <button
            type="button"
            onClick={onEdit}
            aria-label={t("edit", { name: item.name })}
            className={iconButton}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <form
            action={actions.remove}
            onSubmit={(e) => {
              if (!window.confirm(t("deleteConfirm", { name: item.name }))) {
                e.preventDefault();
              }
            }}
          >
            {ids}
            <button
              type="submit"
              aria-label={t("delete", { name: item.name })}
              className={cn(iconButton, "hover:text-destructive")}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

function ItemForm({
  id,
  ctx,
  item,
  onDone,
}: {
  id: string;
  ctx: Ctx;
  item: MenuItem | null;
  onDone: () => void;
}) {
  const { parentId } = ctx;
  const t = useTranslations("Admin");
  const tList = useTranslations(ctx.ns);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    ctx.actions.save,
    {},
  );
  const [uploading, setUploading] = useState(false);
  const [available, setAvailable] = useState(item?.is_available ?? true);
  const fe = state.fieldErrors ?? {};
  const err = (name: string) =>
    fe[name] ? t(`fieldErrors.${fe[name]}`) : undefined;
  const field = (name: string) => `item-${id}-${name}`;

  // Saved: the page refreshes with the new menu, so close the form.
  useEffect(() => {
    if (state.saved) onDone();
  }, [state, onDone]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      noValidate
      className="space-y-4 border-2 border-pasar bg-card p-4"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="parentId" value={parentId} />
      <input type="hidden" name="isNew" value={item ? "0" : "1"} />
      <input type="hidden" name="is_available" value={available ? "1" : "0"} />

      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Field id={field("name")} label={tList("name")} error={err("name")}>
          <Input
            id={field("name")}
            name="name"
            required
            autoFocus
            maxLength={120}
            defaultValue={item?.name}
            placeholder={tList("namePlaceholder")}
            {...describedBy(field("name"), undefined, err("name"))}
          />
        </Field>
        <Field
          id={field("price")}
          label={tList("price")}
          error={err("price")}
          optional
          optionalLabel={t("optional")}
        >
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
              RM
            </span>
            <Input
              id={field("price")}
              name="price"
              inputMode="decimal"
              defaultValue={
                item?.price_rm != null ? item.price_rm.toFixed(2) : ""
              }
              placeholder="5.00"
              className="pl-12"
              {...describedBy(field("price"), undefined, err("price"))}
            />
          </div>
        </Field>
      </div>

      <Field
        id={field("description")}
        label={tList("description")}
        optional
        optionalLabel={t("optional")}
      >
        <textarea
          id={field("description")}
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={item?.description ?? ""}
          placeholder={tList("descriptionPlaceholder")}
          className={cn(CONTROL_CLASS, "py-3")}
        />
      </Field>

      <div className="space-y-1.5">
        <p className="text-sm font-semibold">{tList("photo")}</p>
        <PhotoUploader
          folder={`${ctx.photoBase}/${id}`}
          bucket={ctx.bucket}
          initial={item?.photo_url ? [item.photo_url] : []}
          onBusyChange={setUploading}
          max={1}
          name="photo"
        />
      </div>

      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="size-5 accent-pasar"
        />
        <span>
          <span className="block font-semibold">{tList("available")}</span>
          <span className="block text-sm text-muted-foreground">
            {tList("availableHint")}
          </span>
        </span>
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={pending || uploading}
          className="h-11 bg-cta px-5 font-bold text-on-cta hover:bg-cta/90"
        >
          {pending
            ? t("saving")
            : uploading
              ? t("photos.uploading")
              : item
                ? tList("save")
                : tList("addSubmit")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          disabled={pending}
          className="h-11 px-4"
        >
          {tList("cancel")}
        </Button>
      </div>
    </form>
  );
}
