"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Sheet } from "@/components/ui/sheet";
import { routes } from "@/lib/auth/rules";
import { createGroup } from "@/lib/groups/actions";
import { emptyGroupForm, groupsCopy, type GroupFormValue } from "../_data";
import { toGroupErrors } from "../_lib/form";
import { GroupFormFields, type GroupFormErrors } from "./group-form-fields";

export interface NewGroupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewGroupSheet({ open, onOpenChange }: NewGroupSheetProps) {
  const router = useRouter();
  const [value, setValue] = useState<GroupFormValue>(emptyGroupForm);
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
      setValue(emptyGroupForm);
      router.push(routes.group(result.data.id));
    });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-110"
      title={copy.title}
      description={copy.description}
      actions={
        <>
          <Button size="lg" fullWidth loading={pending} onClick={submit}>
            {copy.create(value.name.trim())}
          </Button>
          <Button variant="tertiary" fullWidth className="h-11" onClick={() => onOpenChange(false)}>
            {copy.cancel}
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
