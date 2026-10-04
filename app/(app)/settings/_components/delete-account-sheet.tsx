"use client";

import { useState } from "react";
import { ExportSheet } from "@/app/(app)/_components/export/export-sheet";
import { Icon, type IconName } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Field } from "@/components/ui/field";
import { GroupArtTile } from "@/components/ui/icon-3d";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/text-field";
import { deleteAccount, deleteStatus } from "@/lib/account/actions";
import { CONFIRM_WORD, matchesConfirm, type DeleteStatus } from "@/lib/account/rules";
import type { ExportGroup } from "@/lib/export/rules";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { cn } from "@/lib/utils/cn";
import { settingsCopy } from "../_data";
import { blockView } from "../_lib/delete-view";

const LIMIT_SECONDS = 60;
const copy = settingsCopy.deleteAccount;

type Phase = "idle" | "working" | "failed";

export interface DeleteAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: DeleteStatus;
  onStatus: (status: DeleteStatus) => void;
  exportGroups: readonly ExportGroup[];
  today: string;
}

function HappensRow({ icon, children }: { icon: IconName; children: string }) {
  return (
    <span className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2.5 text-small">
      <Icon name={icon} size={20} className="text-muted" />
      <span className="text-pretty">{children}</span>
    </span>
  );
}

export function DeleteAccountSheet({ open, onOpenChange, status, onStatus, exportGroups, today }: DeleteAccountSheetProps) {
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [exporting, setExporting] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const cooldown = useCooldown(LIMIT_SECONDS, false);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTyped("");
      setPhase("idle");
    }
  }

  const working = phase === "working";
  const matched = matchesConfirm(typed);
  const limited = cooldown.active;

  const close = (next: boolean) => {
    if (!next && working) return;
    onOpenChange(next);
  };

  const submit = async () => {
    if (!matched || working || limited) return;
    setPhase("working");
    const result = await deleteAccount({ confirm: typed }).catch(() => null);
    if (result?.ok && result.data.kind === "blocked") {
      buzz(HAPTICS.error);
      setTyped("");
      setPhase("idle");
      onStatus({ kind: "blocked", block: result.data.block });
      return;
    }
    if (result?.ok) return;
    buzz(HAPTICS.error);
    if (result?.error.code === "rateLimited") {
      cooldown.restart(result.error.retryAfter ?? LIMIT_SECONDS);
      setPhase("idle");
      return;
    }
    setPhase("failed");
  };

  if (status.kind === "blocked") {
    const view = blockView(status.block);
    return (
      <Sheet
        open={open}
        onOpenChange={close}
        actionsIn="card"
        className="sm:max-w-100"
        icon="alert"
        tint="red"
        title={view.title}
        description={view.body}
        actions={
          <>
            <PressLink href={view.href} className={cn(buttonVariants({ size: "lg", fullWidth: true }))}>
              {view.cta}
            </PressLink>
            <Button variant="tertiary" fullWidth className="h-11" onClick={() => onOpenChange(false)}>
              {copy.blocked.notNow}
            </Button>
          </>
        }
      >
        {view.rows.length > 0 && (
          <Rise className="grid divide-y divide-line rounded-tile bg-surface px-3 py-1">
            {view.rows.map((row) => (
              <span key={row.key} className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <GroupArtTile name={row.group.name} tint={row.group.tint} art={row.group.art} size="sm" />
                <span className="truncate font-medium">{row.group.name}</span>
                <span className={cn("text-small font-semibold", row.owed ? "text-green" : "text-text")}>{row.amount}</span>
              </span>
            ))}
            {view.more > 0 && <span className="flex min-h-10 items-center pl-12 text-footnote font-medium text-text-2">{copy.blocked.more(view.more)}</span>}
          </Rise>
        )}
      </Sheet>
    );
  }

  const words = copy.confirm;
  const alert = phase === "failed" ? { tint: "red" as const, icon: "alert" as const, ...words.failed } : limited ? { tint: "amber" as const, icon: "clock" as const, ...words.limited } : null;

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={close}
        actionsIn="card"
        className="sm:max-w-100"
        icon="trash"
        tint="red"
        title={words.title}
        description={words.body}
        actions={
          <div className="grid gap-4">
            <Field label={words.field} className={cn("transition-opacity duration-200 ease-standard", working && "opacity-50")}>
              {(control) => (
                <span className="relative grid">
                  <Input
                    {...control}
                    value={typed}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (matchesConfirm(next) && !matched) buzz(HAPTICS.addPress);
                      setTyped(next);
                      if (phase === "failed") setPhase("idle");
                    }}
                    disabled={working}
                    autoComplete="off"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="done"
                    placeholder={CONFIRM_WORD}
                    className="pr-11 font-medium tracking-[0.04em] placeholder:tracking-normal"
                  />
                  <Icon
                    name="check"
                    size={20}
                    strokeWidth={2.4}
                    className={cn("pointer-events-none absolute top-3.5 right-3.5 text-green transition-opacity duration-150 ease-standard", matched ? "opacity-100" : "opacity-0")}
                  />
                </span>
              )}
            </Field>
            {alert && (
              <InlineAlert tint={alert.tint} icon={alert.icon}>
                <span className="font-semibold">{alert.strong}</span> {alert.rest}
              </InlineAlert>
            )}
            <div className="grid gap-1">
              <Button
                size="lg"
                fullWidth
                disabled={!matched || limited}
                aria-busy={working || undefined}
                onClick={() => void submit()}
                className={cn("transition-[background-color,color] duration-200", matched && !limited && "bg-red bg-none! text-bg shadow-none hover:bg-red hover:text-bg")}
              >
                {working && <Spinner label={words.working} />}
                {working ? words.working : phase === "failed" ? words.retry : words.submit}
              </Button>
              <Button variant="tertiary" fullWidth disabled={working} className="h-11 disabled:bg-transparent disabled:opacity-40" onClick={() => onOpenChange(false)}>
                {words.keep}
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid gap-2.5">
          <span className="text-footnote font-semibold text-text-2">{words.happens}</span>
          <HappensRow icon="user">{words.profile}</HappensRow>
          <HappensRow icon="exit">{words.groups(status.groups)}</HappensRow>
          <HappensRow icon="receipt">{words.bills}</HappensRow>
        </div>
        <span className={cn("flex flex-wrap items-center gap-x-1 text-small text-text-2 transition-opacity duration-200 ease-standard", working && "pointer-events-none opacity-50")}>
          {words.exportAsk}
          <button type="button" onClick={() => setExporting(true)} className="-my-3 inline-flex min-h-11 cursor-pointer items-center bg-transparent font-semibold text-brand hover:text-brand-hover">
            {words.exportLink}
          </button>
        </span>
      </Sheet>
      <ExportSheet open={exporting} onOpenChange={setExporting} groups={exportGroups} today={today} />
    </>
  );
}

export async function refreshDeleteStatus(): Promise<DeleteStatus | null> {
  const result = await deleteStatus({}).catch(() => null);
  return result?.ok ? result.data : null;
}
