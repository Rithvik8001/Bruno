"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PopIn } from "@/app/(flow)/_components/pop-in";
import { CheckIn } from "@/components/motion/check-in";
import { PressLink } from "@/components/motion/motion-link";
import { BackLink } from "@/components/patterns/back-link";
import { TearOffStub } from "@/components/patterns/tear-off-stub";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Chip } from "@/components/ui/chip";
import { MomentTile } from "@/components/ui/icon-3d";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MoneyInput } from "@/components/ui/money-input";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/actions/errors";
import { formatMoney } from "@/lib/currency";
import { inlineDay } from "@/lib/dates";
import type { PaymentMethod } from "@/lib/ledger/rules";
import { ZERO_CENTS, type Cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import { confirmSettlement, declineSettlement, recordSettlement, undoSettlement } from "@/lib/settlements/actions";
import { SETTLEMENT_NOTE_MAX } from "@/lib/settlements/schema";
import type { SettleUpView } from "@/lib/settlements/queries";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_METHOD, methodLabels, settleCopy, settleStatusTint, type SettleStatus } from "../_data";
import { breakdownText, remainingText, type BackKind } from "../_lib/view";
import { MethodChips } from "./method-chips";

type Done =
  | { readonly kind: "recorded"; readonly id: string; readonly amount: Cents; readonly method: PaymentMethod; readonly left: string | null; readonly pending: boolean }
  | { readonly kind: "confirmed" }
  | { readonly kind: "declined" };

export interface SettleScreenProps {
  view: SettleUpView;
  backHref: string;
  backKind: BackKind;
}

const copy = settleCopy;

const DONE_CHECK_DELAY = 0.5;

export function SettleScreen({ view: live, backHref, backKind }: SettleScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [frozen, setFrozen] = useState<SettleUpView | null>(null);
  const view = frozen ?? live;
  const currency = view.group.currency;
  const name = firstNameOf(view.them.displayName);
  const money = (value: Cents) => formatMoney(value, currency);
  const role = view.role;
  const confirming = role === "confirm" && view.pending !== null;
  const max = confirming && view.pending ? view.pending.amount : view.openAmount;

  const [amount, setAmount] = useState<Cents | null>(max > 0 ? max : null);
  const [method, setMethod] = useState<PaymentMethod>(view.pending?.method ?? DEFAULT_METHOD);
  const [note, setNote] = useState(view.pending?.note ?? "");
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const [seenRole, setSeenRole] = useState(live.role);
  if (!done && !frozen && live.role !== seenRole) {
    const next = live.role === "confirm" && live.pending ? live.pending.amount : live.openAmount;
    setSeenRole(live.role);
    setAmount(next > 0 ? next : null);
    setMethod(live.pending?.method ?? DEFAULT_METHOD);
    setNote(live.pending?.note ?? "");
  }

  const left = remainingText(amount, max, currency);
  const over = amount !== null && amount > max;
  const valid = amount !== null && amount > 0 && !over;
  const locked = confirming || done !== null;
  const toYou = view.balance > 0 || confirming;

  const status: SettleStatus = done
    ? done.kind === "recorded" && done.pending
      ? "awaiting"
      : done.kind === "declined"
        ? "open"
        : done.kind === "recorded" && done.left
          ? "partial"
          : "settled"
    : left
      ? "partial"
      : "open";

  const run = <T,>(task: () => Promise<ActionResult<T>>, onDone: (data: T) => void, freeze = true) =>
    startTransition(async () => {
      setError(null);
      if (freeze) setFrozen(view);
      const result = await task();
      if (!result.ok) {
        setFrozen(null);
        setError(Object.values(result.error.fields ?? {})[0] ?? result.error.message);
        return;
      }
      onDone(result.data);
      router.refresh();
    });

  const record = () => {
    if (!valid || amount === null) return;
    const direction = role === "recipient" ? "received" : "paid";
    run(
      () => recordSettlement({ groupId: view.group.id, personId: view.them.id, direction, amountCents: amount, method, note: note || null }),
      (data) => {
        const pending = data.status === "PENDING";
        setDone({ kind: "recorded", id: data.id, amount, method, left, pending });
        toast({
          message: pending ? copy.payer.toast(name) : left ? copy.recipient.toastPartial(name) : copy.recipient.toastFull(name),
        });
      },
    );
  };

  const confirm = () =>
    view.pending &&
    run(
      () => confirmSettlement({ settlementId: view.pending?.id ?? "" }),
      () => {
        setDone({ kind: "confirmed" });
        toast({ message: copy.confirm.toast(name) });
      },
    );

  const decline = () =>
    view.pending &&
    run(
      () => declineSettlement({ settlementId: view.pending?.id ?? "" }),
      () => {
        setDone({ kind: "declined" });
        toast({ message: copy.confirm.toastDeclined(name) });
      },
    );

  const undo = (settlementId: string) =>
    run(
      () => undoSettlement({ settlementId }),
      () => {
        setDone(null);
        setFrozen(null);
        toast({ message: copy.undone });
      },
      false,
    );

  const header = (
    <div className="flex items-center justify-between gap-3">
      <BackLink href={backHref} label={backKind === "group" ? view.group.name : copy.back[backKind]} />
      <PopIn popKey={status}>
        <Chip tint={settleStatusTint[status]} size="sm" dot role="status">
          {copy.status[status]}
        </Chip>
      </PopIn>
    </div>
  );

  if (!done && (role === "square" || role === "awaiting")) {
    const pending = role === "awaiting" ? view.pending : null;
    const recent = role === "square" ? view.lastRecorded : null;
    return (
      <div className="grid gap-6 px-5 pt-5 pb-10">
        <div className="flex items-center justify-between gap-3">
          <BackLink href={backHref} label={backKind === "group" ? view.group.name : copy.back[backKind]} />
          <PopIn popKey={role}>
            <Chip tint={role === "awaiting" ? "blue" : "green"} size="sm" dot role="status">
              {role === "awaiting" ? copy.status.awaiting : copy.status.settled}
            </Chip>
          </PopIn>
        </div>
        <div className="grid gap-1.5">
          <h1 className="m-0 text-heading">{role === "awaiting" ? copy.awaiting.title(name) : copy.square.title(name)}</h1>
          <p className="m-0 text-text-2">
            {pending ? copy.awaiting.body(money(pending.amount), methodLabels[pending.method]) : copy.square.body}
          </p>
        </div>
        {pending && (
          <InlineAlert tint="blue" icon="clock">
            {copy.awaiting.note(name)}
          </InlineAlert>
        )}
        {(pending?.actions.undo || recent) && (
          <div className="flex items-center gap-3 rounded-tile bg-surface py-3 pr-2 pl-4 text-small">
            <span className="min-w-0 flex-1">
              {recent ? copy.square.recent(money(recent.amount), methodLabels[recent.method]) : copy.awaiting.mistake}
            </span>
            <Button variant="elevated" size="sm" loading={busy} onClick={() => undo(recent?.id ?? pending?.id ?? "")}>
              {copy.undo}
            </Button>
          </div>
        )}
        {error && <InlineAlert>{error}</InlineAlert>}
        <PressLink href={backHref} className={cn(buttonVariants({ size: "lg" }), "justify-self-start")}>
          {copy.backTo[backKind]}
        </PressLink>
      </div>
    );
  }

  const title = confirming ? copy.confirm.title(name) : role === "recipient" ? copy.recipient.title(name) : copy.payer.title(name);
  const body = confirming ? copy.confirm.body(name) : role === "recipient" ? copy.recipient.body(name) : copy.payer.body;
  const shown = amount ?? ZERO_CENTS;
  const cta = confirming ? copy.confirm.cta(money(shown)) : role === "recipient" ? copy.recipient.cta(money(shown)) : copy.payer.cta(money(shown));
  const fine = confirming
    ? copy.confirm.fine(view.pending?.autoConfirmAt ? inlineDay(view.pending.autoConfirmAt, new Date()) : "")
    : role === "recipient"
      ? copy.recipient.fine
      : copy.payer.fine(name);
  const from = toYou ? view.them : view.you;
  const to = toYou ? view.you : view.them;

  const doneTitle =
    done?.kind === "declined"
      ? copy.confirm.declined
      : done?.kind === "confirmed"
        ? copy.confirm.done(name)
        : done?.kind === "recorded" && done.pending
          ? copy.payer.done
          : done?.kind === "recorded" && done.left
            ? copy.recipient.donePartial(money(done.amount), name)
            : copy.recipient.doneFull(name);
  const doneSub =
    done?.kind === "declined"
      ? copy.confirm.declinedSub(name)
      : done?.kind === "recorded" && done.pending
        ? copy.payer.doneSub(methodLabels[done.method], name)
        : copy.doneSub(methodLabels[done?.kind === "recorded" ? done.method : method], done?.kind === "recorded" ? done.left : null);

  return (
    <div className="grid gap-6 px-5 pt-5 pb-10">
      {header}
      <div className="grid gap-1.5">
        <h1 className="m-0 text-heading">{title}</h1>
        <p className="m-0 max-w-[48ch] text-text-2">{body}</p>
      </div>

      <TearOffStub
        torn={done !== null}
        celebrate={status === "settled"}
        tearOff={
          <>
            <Button size="lg" fullWidth loading={busy} disabled={!valid} onClick={confirming ? confirm : record}>
              {cta}
            </Button>
            {confirming && (
              <Button variant="tertiary" fullWidth className="h-11" disabled={busy} onClick={decline}>
                {copy.confirm.decline}
              </Button>
            )}
            <span className="text-center text-caption font-normal text-muted">{fine}</span>
          </>
        }
        done={
          <>
            <div className="flex items-center gap-3">
              <span className="relative shrink-0">
                <MomentTile icon={done?.kind === "declined" ? "warning" : "moneywings"} tint={done?.kind === "declined" ? "amber" : "green"} size="sm" />
                {done && done.kind !== "declined" && (
                  <CheckIn
                    aria-hidden
                    transition={{ delay: DONE_CHECK_DELAY }}
                    className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-green text-bg ring-2 ring-surface"
                  >
                    <Icon name="check" size={12} strokeWidth={3} />
                  </CheckIn>
                )}
              </span>
              <span className="grid">
                <span className="font-semibold">{doneTitle}</span>
                <span className="text-footnote text-text-2">{doneSub}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <PressLink href={backHref} className={cn(buttonVariants({ size: "md" }), "h-11 text-small font-semibold")}>
                {copy.backTo[backKind]}
              </PressLink>
              {done?.kind === "recorded" && (
                <Button variant="elevated" size="md" className="h-11 text-small font-semibold" loading={busy} onClick={() => undo(done.id)}>
                  {copy.undo}
                </Button>
              )}
            </div>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <Avatar name={from.displayName} tint={from.tint} buddy={from.buddy} size="xl" className="size-11" />
          <Icon name="arrow-right" size={20} className="shrink-0 text-muted" />
          <Avatar name={to.displayName} tint={to.tint} buddy={to.buddy} size="xl" className="size-11" />
          <span className="grid min-w-0 flex-1">
            <span className="font-semibold">{toYou ? copy.payLine.toYou(name) : copy.payLine.fromYou(name)}</span>
            {view.breakdown.length > 0 && (
              <span className="truncate text-footnote text-text-2">{breakdownText(view.breakdown, currency)}</span>
            )}
          </span>
        </div>
        <MoneyInput
          aria-label={copy.amount}
          currency={currency}
          value={amount}
          onValueChange={setAmount}
          disabled={locked}
          className="rounded-tile bg-bg px-4 py-3.5"
          trailing={
            done ? null : over ? (
              <Chip tint="red" size="xs" className="h-6 self-center px-2 text-caption">
                {copy.over(money(max))}
              </Chip>
            ) : left ? (
              <Chip tint="amber" size="xs" className="h-6 self-center px-2 text-caption">
                {copy.partial(left)}
              </Chip>
            ) : null
          }
        />
        <MethodChips value={method} onValueChange={setMethod} disabled={locked} />
        <TextField
          label={copy.note.label}
          placeholder={copy.note.placeholder}
          value={note}
          maxLength={SETTLEMENT_NOTE_MAX}
          disabled={locked}
          onChange={(e) => setNote(e.target.value)}
          fieldClassName="[&>label]:text-footnote [&>label]:text-text-2"
          className="h-11 bg-bg"
        />
      </TearOffStub>

      {done?.kind === "recorded" && done.pending && (
        <InlineAlert tint="blue" icon="clock">
          {copy.awaiting.note(name)}
        </InlineAlert>
      )}
      {error && <InlineAlert>{error}</InlineAlert>}
    </div>
  );
}
