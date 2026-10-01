"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { routes } from "@/lib/auth/rules";
import { deleteGroup, resetInviteLink, updateGroup } from "@/lib/groups/actions";
import type { GroupFormValue } from "../../_data";
import { toGroupErrors } from "../../_lib/form";
import { GroupFormFields, type GroupFormErrors } from "../../_components/group-form-fields";
import { groupDetailCopy } from "../_data";

export interface GroupSettingsProps {
  groupId: string;
  initial: GroupFormValue;
  currencyLocked: boolean;
  canDelete: boolean;
}

type View = "form" | "reset" | "delete";

export function GroupSettings({ groupId, initial, currencyLocked, canDelete }: GroupSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("form");
  const [value, setValue] = useState<GroupFormValue>(initial);
  const [errors, setErrors] = useState<GroupFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const copy = groupDetailCopy.settingsSheet;

  const openSheet = () => {
    setValue(initial);
    setErrors({});
    setFormError(null);
    setView("form");
    setOpen(true);
  };

  const save = () =>
    startTransition(async () => {
      const result = await updateGroup({ groupId, ...value });
      if (!result.ok) {
        setErrors(toGroupErrors(result.error.fields));
        if (!result.error.fields) setFormError(result.error.message);
        return;
      }
      setOpen(false);
      toast({ message: copy.saved });
      router.refresh();
    });

  const reset = () =>
    startTransition(async () => {
      const result = await resetInviteLink({ groupId });
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }
      setOpen(false);
      toast({ message: copy.resetDone });
      router.refresh();
    });

  const remove = () =>
    startTransition(async () => {
      const result = await deleteGroup({ groupId });
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }
      setOpen(false);
      router.push(routes.groups);
    });

  const confirmActions = (label: string, onConfirm: () => void) => (
    <>
      <Button variant="danger" size="lg" fullWidth loading={pending} onClick={onConfirm}>
        {label}
      </Button>
      <Button variant="tertiary" fullWidth className="h-11" onClick={() => setView("form")}>
        {copy.cancel}
      </Button>
    </>
  );

  return (
    <>
      <IconButton icon="settings" label={copy.title} onClick={openSheet} className="bg-surface hover:bg-surface-2" />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        size={view === "form" ? "full" : "auto"}
        className="sm:max-w-110"
        title={view === "reset" ? copy.reset : view === "delete" ? copy.delete : copy.title}
        description={view === "reset" ? copy.resetBody : view === "delete" ? copy.deleteBody : copy.description}
        actions={
          view === "reset" ? (
            confirmActions(copy.reset, reset)
          ) : view === "delete" ? (
            confirmActions(copy.delete, remove)
          ) : (
            <>
              <Button size="lg" fullWidth loading={pending} onClick={save}>
                {copy.save}
              </Button>
              <Button variant="secondary" fullWidth className="h-11" onClick={() => setView("reset")}>
                {copy.reset}
              </Button>
              <Button
                variant="tertiary"
                fullWidth
                className="h-11 text-red hover:text-red"
                disabled={!canDelete}
                title={canDelete ? undefined : copy.deleteBlocked}
                onClick={() => setView("delete")}
              >
                {copy.delete}
              </Button>
            </>
          )
        }
      >
        {view === "form" && (
          <GroupFormFields
            value={value}
            onChange={(next) => {
              setValue(next);
              setErrors({});
            }}
            errors={errors}
            currencyLocked={currencyLocked}
          />
        )}
        {formError && <InlineAlert>{formError}</InlineAlert>}
      </Sheet>
    </>
  );
}
