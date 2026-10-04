"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { PressLink } from "@/components/motion/motion-link";
import { pressMotion } from "@/components/motion/press";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { IconButton } from "@/components/ui/icon-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { routes } from "@/lib/auth/rules";
import { deleteBill } from "@/lib/bills/actions";
import { reopenClaiming } from "@/lib/claiming/actions";
import { cn } from "@/lib/utils/cn";
import { billDetailCopy } from "../_data";

export interface BillActionsProps {
  billId: string;
  title: string;
  shareText: string;
  editHref: string | null;
  splitHref: string | null;
  canReopen: boolean;
}

type SheetState = "menu" | "confirm" | null;

const SHARED_SECONDS = 2;

export function BillActions({ billId, title, shareText, editHref, splitHref, canReopen }: BillActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [sheet, setSheet] = useState<SheetState>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shared = useCooldown(SHARED_SECONDS, false);
  const copy = billDetailCopy;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      shared.restart();
    } catch {
      toast({ message: copy.actions.shareFailed });
    }
  };

  const close = () => {
    setSheet(null);
    setError(null);
  };

  const remove = () =>
    startTransition(async () => {
      const result = await deleteBill({ billId });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      close();
      toast({ message: copy.deleteSheet.done(result.data.title) });
      router.push(routes.group(result.data.groupId));
    });

  const reopen = () =>
    startTransition(async () => {
      const result = await reopenClaiming({ billId });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      close();
      toast({ message: copy.actions.reopened });
      router.push(routes.claimBill(result.data.code));
    });

  return (
    <div className="flex items-center gap-1">
      <motion.button
        type="button"
        onClick={share}
        {...pressMotion()}
        aria-label={shared.active ? copy.actions.shared : copy.actions.share}
        className={cn(
          "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-sm bg-transparent px-2.5 text-small font-semibold transition-colors duration-150 ease-standard hover:bg-surface sm:pr-3 pointer-coarse:h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center",
          shared.active ? "text-green" : "text-text-2",
        )}
      >
        {shared.active ? (
          <CheckIn className="inline-grid">
            <Icon name="check" size={16} strokeWidth={2} />
          </CheckIn>
        ) : (
          <Icon name="upload" size={16} strokeWidth={2} />
        )}
        <span className="hidden sm:inline">{shared.active ? copy.actions.shared : copy.actions.share}</span>
      </motion.button>
      {editHref && (
        <PressLink
          href={editHref}
          aria-label={copy.actions.edit}
          className="grid size-9 place-items-center rounded-sm text-text-2 hover:bg-surface hover:text-text pointer-coarse:size-11"
        >
          <Icon name="pencil" size={16} strokeWidth={2} />
        </PressLink>
      )}
      {splitHref && (
        <IconButton icon="more" label={copy.actions.more} className="size-9 rounded-sm" onClick={() => setSheet("menu")} />
      )}
      {sheet !== null && (
        <Sheet
          open
          onOpenChange={(open) => !open && close()}
          title={sheet === "confirm" ? copy.deleteSheet.title : title}
          description={sheet === "confirm" ? copy.deleteSheet.body : copy.actions.menuBody}
          icon={sheet === "confirm" ? { moment: "warning" } : undefined}
          tint="red"
          actions={
            sheet === "confirm" ? (
              <>
                <Button variant="tertiary" onClick={() => setSheet("menu")}>
                  {copy.deleteSheet.cancel}
                </Button>
                <Button variant="danger" loading={pending} onClick={remove}>
                  {copy.deleteSheet.confirm}
                </Button>
              </>
            ) : (
              <>
                <Button variant="tertiary" onClick={close}>
                  {copy.actions.cancel}
                </Button>
                <Button variant="danger" onClick={() => setSheet("confirm")}>
                  {copy.actions.delete}
                </Button>
                {splitHref && (
                  <PressLink href={splitHref} className={cn(buttonVariants({ variant: "secondary" }))}>
                    {copy.actions.changeSplit}
                  </PressLink>
                )}
                {canReopen && (
                  <Button variant="secondary" loading={pending} onClick={reopen}>
                    {copy.actions.reopen}
                  </Button>
                )}
              </>
            )
          }
        >
          {error ? <InlineAlert>{error}</InlineAlert> : null}
        </Sheet>
      )}
    </div>
  );
}
