"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/actions/errors";
import { routes } from "@/lib/auth/rules";
import type { GroupRole } from "@/lib/domain/permissions";
import { leaveGroup, removeMember, setMemberRole } from "@/lib/groups/actions";
import { groupDetailCopy } from "../_data";

export interface MemberSheetTarget {
  readonly personId: string;
  readonly name: string;
  readonly role: GroupRole;
  readonly isYou: boolean;
}

export interface MemberSheetProps {
  groupId: string;
  target: MemberSheetTarget | null;
  canManage: boolean;
  onClose: () => void;
}

type Confirm = "remove" | "leave" | null;

export function MemberSheet({ groupId, target, canManage, onClose }: MemberSheetProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const copy = groupDetailCopy.memberSheet;

  const close = () => {
    setConfirm(null);
    setError(null);
    onClose();
  };

  const run = (task: () => Promise<ActionResult<{ id: string }>>, after?: () => void) =>
    startTransition(async () => {
      const result = await task();
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      close();
      if (after) after();
      else router.refresh();
    });

  if (!target) return null;

  const confirming = confirm !== null;
  const title = confirm === "remove" ? copy.confirmRemove(target.name) : confirm === "leave" ? copy.confirmLeave : target.name;
  const description =
    confirm === "remove" ? copy.confirmRemoveBody : confirm === "leave" ? copy.confirmLeaveBody : undefined;

  return (
    <Sheet
      open
      onOpenChange={(open) => !open && close()}
      title={title}
      description={description}
      actions={
        confirming ? (
          <>
            <Button
              variant="danger"
              size="lg"
              fullWidth
              loading={pending}
              onClick={() =>
                confirm === "leave"
                  ? run(() => leaveGroup({ groupId }), () => router.push(routes.groups))
                  : run(() => removeMember({ groupId, personId: target.personId }))
              }
            >
              {copy.confirm}
            </Button>
            <Button variant="tertiary" fullWidth className="h-11" onClick={() => setConfirm(null)}>
              {copy.cancel}
            </Button>
          </>
        ) : (
          <>
            {canManage && !target.isYou && (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                loading={pending}
                onClick={() =>
                  run(async () => {
                    const role: GroupRole = target.role === "ADMIN" ? "MEMBER" : "ADMIN";
                    const result = await setMemberRole({ groupId, personId: target.personId, role });
                    if (result.ok) toast({ message: role === "ADMIN" ? copy.makeAdmin : copy.makeMember });
                    return result;
                  })
                }
              >
                {target.role === "ADMIN" ? copy.makeMember : copy.makeAdmin}
              </Button>
            )}
            {canManage && !target.isYou && (
              <Button variant="danger" size="lg" fullWidth onClick={() => setConfirm("remove")}>
                {copy.remove}
              </Button>
            )}
            {target.isYou && (
              <Button variant="danger" size="lg" fullWidth onClick={() => setConfirm("leave")}>
                {copy.leave}
              </Button>
            )}
            <Button variant="tertiary" fullWidth className="h-11" onClick={close}>
              {copy.cancel}
            </Button>
          </>
        )
      }
    >
      {error ? <InlineAlert>{error}</InlineAlert> : null}
    </Sheet>
  );
}
