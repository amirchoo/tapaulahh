"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** A form that asks "are you sure?" before running a delete action. */
export function DeleteButton({
  action,
  fields,
  label,
  confirmText,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  confirmText: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton label={label} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      className="h-11 gap-2 rounded-xl px-4"
    >
      <Trash2 className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
