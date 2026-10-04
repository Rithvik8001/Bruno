"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Sheet } from "@/components/ui/sheet";
import { routes } from "@/lib/auth/rules";
import type { CurrencyCode } from "@/lib/currency";
import { createGroup } from "@/lib/groups/actions";
import { emptyGroupForm, groupsCopy, type GroupFormValue } from "../_data";
import { toGroupErrors } from "../_lib/form";
import { GroupFormFields, type GroupFormErrors } from "./group-form-fields";

export interface NewGroupSheetProps {
  defaultCurrency: CurrencyCode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewGroupSheet({ defaultCurrency, open, onOpenChange }: NewGroupSheetProps) {
  const router = useRouter();
  const [value, setValue] = useState<GroupFormValue>(() => emptyGroupForm(defaultCurrency));
  const [errors, setErrors] = useState<GroupFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const copy = groupsCopy.sheet;

  const submit = () =>
    startTransition(async () => {
      setFormError(null);
      const result = await createGroup(value);
      if (!result.ok) {
        setErrors(toGroupErrors(result.error.fields));
        if (!result.error.fields) setFormError(result.error.message);
        return;
      }
      onOpenChange(false);
      setValue(emptyGroupForm(defaultCurrency));
      router.push(routes.group(result.data.id));
    });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      size="full"
      className="sm:max-w-110"
      title={copy.title}
      description={copy.description}
      actions={
        <>
          <Button variant="tertiary" onClick={() => onOpenChange(false)}>
            {copy.cancel}
          </Button>
          <Button loading={pending} onClick={submit} className="min-w-0 shrink">
            <span className="truncate">{copy.create(value.name.trim())}</span>
          </Button>
        </>
      }
    >
      <GroupFormFields
        value={value}
        onChange={(next) => {
          setValue(next);
          setErrors({});
        }}
        errors={errors}
      />
      {formError && <InlineAlert>{formError}</InlineAlert>}
    </Sheet>
  );
}
