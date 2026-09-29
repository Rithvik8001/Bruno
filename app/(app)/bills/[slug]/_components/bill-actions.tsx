"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icons/icon";
import { Button, buttonVariants } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { routes } from "@/lib/auth/rules";
import { deleteBill } from "@/lib/bills/actions";
import { cn } from "@/lib/utils/cn";
import { billDetailCopy } from "../_data";

export interface BillActionsProps {
  billId: string;
  title: string;
  shareText: string;
  editHref: string | null;
  splitHref: string | null;
}

type SheetState = "menu" | "confirm" | null;

const SHARED_SECONDS = 2;

export function BillActions({ billId, title, shareText, editHref, splitHref }: BillActionsProps) {
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
      toast({ message: copy.actions.shareFailed, icon: "alert", tint: "red" });
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
      toast({ message: copy.deleteSheet.done(result.data.title), icon: "check", tint: "green" });
      router.push(routes.group(result.data.groupId));
    });

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={share}
        className={cn(
          "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-sm bg-transparent pr-3 pl-2.5 text-small font-semibold transition-colors duration-150 ease-standard hover:bg-surface",
          shared.active ? "text-green" : "text-text-2",
        )}
      >
        <Icon name={shared.active ? "check" : "upload"} size={16} strokeWidth={2} />
        {shared.active ? copy.actions.shared : copy.actions.share}
      </button>
      {editHref && (
        <Link
          href={editHref}
          aria-label={copy.actions.edit}
          className="grid size-9 place-items-center rounded-sm text-text-2 hover:bg-surface hover:text-text"
        >
          <Icon name="pencil" size={16} strokeWidth={2} />
        </Link>
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
                <Button variant="danger" size="lg" fullWidth loading={pending} onClick={remove}>
                  {copy.deleteSheet.confirm}
                </Button>
                <Button variant="tertiary" fullWidth className="h-11" onClick={() => setSheet("menu")}>
                  {copy.deleteSheet.cancel}
                </Button>
              </>
            ) : (
              <>
                {splitHref && (
                  <Link href={splitHref} className={cn(buttonVariants({ variant: "secondary", size: "lg", fullWidth: true }))}>
                    {copy.actions.changeSplit}
                  </Link>
                )}
                <Button variant="danger" size="lg" fullWidth onClick={() => setSheet("confirm")}>
                  {copy.actions.delete}
                </Button>
                <Button variant="tertiary" fullWidth className="h-11" onClick={close}>
                  {copy.actions.cancel}
                </Button>
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
