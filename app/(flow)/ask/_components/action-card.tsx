"use client";

import { motion } from "motion/react";
import { Icon, type IconName } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { PrintIn, Rise } from "@/components/motion/rise";
import { AmountInput } from "@/components/ui/amount-input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { CheckIndicator } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { GroupArtTile } from "@/components/ui/icon-3d";
import { Spinner } from "@/components/ui/spinner";
import { AI_LIMITS, type Allowance } from "@/lib/ai/rules";
import type { AskDecision } from "@/lib/ask/actions/kinds";
import { currencySymbol, formatAmount } from "@/lib/currency";
import type { Tint } from "@/lib/design-system/tokens";
import type { Cents } from "@/lib/money";
import { T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { askCopy } from "../_data";
import type { ActionLink, ActionView, BillTile, FactView, PairView, PayView, PersonRowView, TableRowView } from "../_lib/action-view";

export type ActionCardState = "ready" | "working" | "failed" | "stale" | "limit" | "denied";

export interface ActionCardProps {
  view: ActionView;
  state: ActionCardState;
  declining: boolean;
  error: string | null;
  quota: Allowance;
  denied: { readonly alert: { readonly title: string; readonly body: string }; readonly link: ActionLink } | null;
  onToggle: (key: string) => void;
  onAmount: (value: Cents | null) => void;
  onConfirm: (decision: AskDecision | null) => void;
  onCancel: () => void;
  onRefresh: () => void;
}

const BUTTONS_DELAY = 0.42;
const ROW_STAGGER = 0.04;
const tile = "rounded-tile bg-bg";
const actionButton = "h-auto min-h-12 px-4.5 py-2 text-[15px] leading-5 whitespace-normal";

function Bill({ bill }: { bill: BillTile }) {
  return (
    <PressLink
      wide
      href={bill.href}
      className={cn(tile, "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3 text-text no-underline transition-shadow duration-150 ease-standard hover:text-text hover:shadow-float")}
    >
      <span className="grid min-w-0 gap-1.5">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 font-semibold wrap-anywhere">{bill.title}</span>
          <Chip tint={bill.group.tint} size="xs" dot className="h-5.5">
            {bill.group.name}
          </Chip>
        </span>
        <span className="text-footnote text-text-2">{bill.meta}</span>
      </span>
      <span className="grid justify-items-end gap-0.5">
        <span className="font-semibold whitespace-nowrap">{bill.total}</span>
        <span className="text-caption font-normal whitespace-nowrap text-muted">{bill.when}</span>
      </span>
    </PressLink>
  );
}

function Pay({ pay, locked, onAmount }: { pay: PayView; locked: boolean; onAmount: (value: Cents | null) => void }) {
  const copy = askCopy.act;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={pay.from.displayName} tint={pay.from.tint} buddy={pay.from.buddy} size="xl" className="size-11" />
        <Icon name="arrow-right" size={18} strokeWidth={2} className="shrink-0 text-muted" />
        <Avatar name={pay.to.displayName} tint={pay.to.tint} buddy={pay.to.buddy} size="xl" className="size-11" />
        <span className="grid min-w-0 flex-1">
          <span className="font-semibold text-pretty">{pay.line}</span>
          {pay.meta !== "" && <span className="text-footnote text-text-2">{pay.meta}</span>}
        </span>
      </div>
      <label
        className={cn(
          tile,
          "flex min-w-0 flex-wrap items-baseline gap-1.5 border-[1.5px] border-transparent px-4 py-3.5 transition-colors duration-150 ease-standard",
          pay.editable && "focus-within:border-brand",
        )}
      >
        <span aria-hidden className="text-[28px] leading-9 font-semibold text-muted">
          {currencySymbol(pay.currency)}
        </span>
        {pay.editable ? (
          <span className="min-w-0 flex-[1_1_120px] text-[40px] leading-[46px]">
            <AmountInput
              value={pay.amount}
              onValueChange={onAmount}
              currency={pay.currency}
              aria-label={copy.amountLabel}
              disabled={locked}
              size={1}
              className="h-auto rounded-none border-0 p-0 text-left text-[40px] leading-[46px] tracking-[-0.025em] hover:bg-transparent focus:border-0 focus:bg-transparent disabled:text-text"
            />
          </span>
        ) : (
          <span className="min-w-0 flex-[1_1_120px] text-[40px] leading-[46px] font-semibold tracking-[-0.025em]">
            {pay.amount === null ? "" : formatAmount(pay.amount, pay.currency, "never")}
          </span>
        )}
        {pay.chip && (
          <span data-tint={pay.chip.tint} className="inline-flex h-6 items-center rounded-[7px] bg-tint-bg px-2 text-caption font-semibold whitespace-nowrap text-tint">
            {pay.chip.text}
          </span>
        )}
        {pay.editable && <span className="basis-full text-caption font-medium text-muted">{copy.amountHint}</span>}
      </label>
    </div>
  );
}

function People({ people, checkable, locked, onToggle }: { people: readonly PersonRowView[]; checkable: boolean; locked: boolean; onToggle: (key: string) => void }) {
  return (
    <div className={cn(tile, "grid px-1.5 py-0.5")}>
      {people.map((row, index) => {
        const tickable = checkable && !row.blocked;
        return (
          <PrintIn key={row.key} index={index} transition={{ delay: 0.2 + index * ROW_STAGGER }}>
            <button
              type="button"
              role={tickable ? "checkbox" : undefined}
              aria-checked={tickable ? row.on : undefined}
              disabled={!tickable || locked}
              onClick={() => onToggle(row.key)}
              className={cn(
                "grid min-h-16 w-full items-center gap-3 bg-transparent px-2 py-2.5 text-left text-text",
                checkable ? "grid-cols-[24px_36px_minmax(0,1fr)_auto]" : "grid-cols-[36px_minmax(0,1fr)_auto]",
                index > 0 && "border-t border-line",
                tickable && !locked ? "cursor-pointer" : "cursor-default",
              )}
            >
              {checkable && (row.blocked ? <span aria-hidden className="size-6" /> : <CheckIndicator checked={row.on} className="size-6" />)}
              <Avatar name={row.person.displayName} tint={row.person.tint} buddy={row.person.buddy} size="lg" className={cn(row.blocked && "opacity-50")} />
              <span className="grid min-w-0">
                <span className={cn("truncate font-medium", row.blocked && "text-muted")}>{row.person.displayName}</span>
                <span data-tint={row.blocked ? "amber" : undefined} className={cn("text-footnote text-pretty", row.blocked ? "text-tint" : "text-text-2")}>
                  {row.sub}
                </span>
              </span>
              <span className={cn("font-semibold whitespace-nowrap", (row.blocked || (checkable && !row.on)) && "text-muted")}>{row.amount}</span>
            </button>
          </PrintIn>
        );
      })}
    </div>
  );
}

function Table({ rows }: { rows: readonly TableRowView[] }) {
  const copy = askCopy.act;
  const columns = "grid grid-cols-[minmax(0,1fr)_76px_84px] gap-2";
  return (
    <div className="grid gap-1.5">
      <div className={cn(columns, "px-3.5 text-caption font-semibold text-muted")}>
        <span>{copy.share}</span>
        <span className="text-right">{copy.before}</span>
        <span className="text-right">{copy.after}</span>
      </div>
      <div className={cn(tile, "grid px-3.5 py-0.5")}>
        {rows.map((row, index) => (
          <PrintIn key={row.key} index={index} transition={{ delay: 0.2 + index * ROW_STAGGER }} className={cn(columns, "min-h-13 items-center", index > 0 && "border-t border-line")}>
            <span className="flex min-w-0 items-center gap-2.5">
              <Avatar name={row.person.displayName} tint={row.person.tint} buddy={row.person.buddy} size="md" className="size-7" />
              <span className="truncate font-medium">{row.name}</span>
            </span>
            <span className={cn("text-right whitespace-nowrap text-muted", row.struck && "line-through")}>{row.before}</span>
            <span className={cn("inline-flex h-7 items-center justify-self-end rounded-sm px-2 font-semibold whitespace-nowrap", row.changed ? "bg-brand-tint text-brand" : "text-text")}>{row.after}</span>
          </PrintIn>
        ))}
      </div>
    </div>
  );
}

function Pairs({ pairs }: { pairs: readonly PairView[] }) {
  return (
    <div className="grid gap-2">
      {pairs.map((pair) => (
        <div key={pair.label} className={cn(tile, "grid gap-2 px-3.5 py-3")}>
          <span className="text-caption font-semibold text-muted">{pair.label}</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-8 items-center rounded-sm bg-surface-2 px-2.5 py-1 font-medium text-text-2 line-through decoration-muted">{pair.before}</span>
            <Icon name="arrow-right" size={16} strokeWidth={2} className="shrink-0 text-muted" />
            <span className="inline-flex min-h-8 items-center rounded-sm bg-brand-tint px-2.5 py-1 font-semibold text-brand">{pair.after}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Facts({ facts }: { facts: readonly FactView[] }) {
  return (
    <div className={cn(tile, "grid px-3.5 py-0.5")}>
      {facts.map((fact, index) => (
        <div key={fact.label} className={cn("flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2", index > 0 && "border-t border-line")}>
          <span className="text-small text-text-2">{fact.label}</span>
          <span data-tint={fact.good ? "green" : undefined} className={cn("inline-flex min-w-0 items-center gap-2 text-right font-semibold text-pretty", fact.good ? "text-tint" : "text-text")}>
            {fact.group && <GroupArtTile name={fact.group.name} tint={fact.group.tint} art={fact.group.art} size="xs" className="size-5.5 rounded-[7px]" />}
            {fact.value}
          </span>
        </div>
      ))}
    </div>
  );
}

interface AlertView {
  readonly icon: IconName;
  readonly tint: Tint | null;
  readonly title: string;
  readonly body: string;
}

function alertFor({ state, error, quota, denied, view }: Pick<ActionCardProps, "state" | "error" | "quota" | "denied" | "view">): AlertView | null {
  const copy = askCopy.act.alert;
  if (state === "denied" && denied) return { icon: "lock", tint: null, title: denied.alert.title, body: denied.alert.body };
  if (state === "stale") return { icon: "refresh", tint: "amber", title: copy.stale.title, body: copy.stale.body(view.place) };
  if (state === "failed") return { icon: "alert", tint: "red", title: copy.failed.title, body: error ?? copy.failed.body };
  if (state === "limit") return { icon: "clock", tint: "amber", title: copy.limit.title(quota.limit), body: copy.limit.body(quota.plan === "PRO", AI_LIMITS.PRO) };
  return null;
}

export function ActionCard({ view, state, declining, error, quota, denied, onToggle, onAmount, onConfirm, onCancel, onRefresh }: ActionCardProps) {
  const copy = askCopy.act;
  const working = state === "working";
  const dimmed = working || state === "stale";
  const alert = alertFor({ state, error, quota, denied, view });
  const last = quota.left === 1 && (state === "ready" || state === "working");
  const foot =
    state === "denied" || state === "failed"
      ? copy.foot.free
      : state === "stale"
        ? copy.foot.stale
        : state === "limit"
          ? copy.foot.none
          : working
            ? copy.foot.working
            : last
              ? copy.foot.last
              : copy.foot.ready;
  const solid = view.danger ? "bg-red text-bg hover:bg-red hover:text-bg" : undefined;
  const notNow = (
    <Button variant="tertiary" size="lg" onClick={onCancel} className="h-12 px-3.5 text-small hover:bg-surface-2">
      {copy.notNow}
    </Button>
  );

  return (
    <Rise aria-busy={working} data-tint={view.danger ? "red" : undefined} className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4.5 rounded-card p-5", view.danger ? "bg-tint-bg" : "bg-surface")}>
      <div className="flex min-h-7 min-w-0 items-center gap-2.5">
        <span aria-hidden className={cn("grid size-7 shrink-0 place-items-center rounded-[9px]", view.danger ? "bg-bg text-tint" : "bg-brand-tint text-brand")}>
          <Icon name={view.icon} size={16} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 text-footnote font-semibold text-text-2">{view.eyebrow}</span>
      </div>

      <div className="grid gap-1 text-text">
        <span className="text-title text-pretty">{view.title}</span>
        {view.sub && <span className="text-small text-pretty text-text-2">{view.sub}</span>}
      </div>

      <motion.div
        animate={{ opacity: dimmed ? 0.5 : 1 }}
        transition={{ duration: T.t2 }}
        className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 text-text", (dimmed || state === "denied") && "pointer-events-none")}
      >
        {view.bill && <Bill bill={view.bill} />}
        {view.pay && <Pay pay={view.pay} locked={state !== "ready" && state !== "failed"} onAmount={onAmount} />}
        {view.people.length > 0 && <People people={view.people} checkable={view.checkable} locked={state !== "ready" && state !== "failed"} onToggle={onToggle} />}
        {view.items.length > 0 && (
          <div className="grid gap-1.5">
            <span className="text-caption font-semibold text-muted">{copy.stillUnclaimed}</span>
            <div className={cn(tile, "grid px-3.5 py-1")}>
              {view.items.map((item, index) => (
                <div key={`${item.name}-${index}`} className={cn("flex min-h-11 items-center justify-between gap-3", index > 0 && "border-t border-line")}>
                  <span className="min-w-0">{item.name}</span>
                  <span className="font-semibold whitespace-nowrap">{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {view.pairs.length > 0 && <Pairs pairs={view.pairs} />}
        {view.table.length > 0 && <Table rows={view.table} />}
        {view.facts.length > 0 && <Facts facts={view.facts} />}
        {view.total && (
          <div className={cn(tile, "flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3")}>
            <span className="font-semibold">{view.total.label}</span>
            <span className="flex flex-wrap items-center gap-2.5">
              {(view.total.values.length > 0 ? view.total.values : ["—"]).map((value, index) => (
                <span key={value} className="inline-flex items-center gap-2.5">
                  {index > 0 && <span aria-hidden className="h-4.5 w-px bg-border" />}
                  <span className="text-title whitespace-nowrap">{value}</span>
                </span>
              ))}
            </span>
          </div>
        )}
        {view.note && state !== "denied" && (
          <span className="flex items-start gap-2 px-0.5 text-footnote text-pretty text-text-2">
            <Icon name="mail" size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
            {view.note}
          </span>
        )}
      </motion.div>

      {alert && (
        <Rise role="alert" data-tint={alert.tint ?? undefined} className={cn("flex items-start gap-3 rounded-tile p-3.5", alert.tint ? "bg-tint-bg" : "bg-bg")}>
          <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-[11px] bg-bg", alert.tint ? "text-tint" : "bg-surface text-text-2")}>
            <Icon name={alert.icon} size={18} strokeWidth={2} />
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="font-semibold text-text">{alert.title}</span>
            <span className="text-small text-pretty text-text-2">{alert.body}</span>
          </span>
        </Rise>
      )}

      <Rise delay={BUTTONS_DELAY} className="flex flex-wrap items-center gap-2">
        {state === "denied" && denied && (
          <PressLink href={denied.link.href} className={cn(buttonVariants({ variant: "elevated", size: "lg" }), actionButton)}>
            {denied.link.label}
            <Icon name="arrow-right" size={16} strokeWidth={2} className="shrink-0" />
          </PressLink>
        )}
        {state === "stale" && (
          <>
            <Button variant="elevated" size="lg" onClick={onRefresh} className={actionButton}>
              <Icon name="refresh" size={16} strokeWidth={2} className="shrink-0" />
              {copy.refresh}
            </Button>
            {notNow}
          </>
        )}
        {state === "limit" && notNow}
        {working && (
          <Button variant={view.danger ? "danger" : "primary"} size="lg" aria-busy className={cn(actionButton, solid, "cursor-progress")}>
            <Spinner className="shrink-0" />
            {declining && view.secondary ? view.secondary.working : view.primary.working}
          </Button>
        )}
        {(state === "ready" || state === "failed") && (
          <>
            <Button
              variant={view.danger ? "danger" : "primary"}
              size="lg"
              disabled={view.primary.disabled}
              onClick={() => onConfirm(view.secondary ? "confirm" : null)}
              className={cn(actionButton, !view.primary.disabled && solid, "max-w-full disabled:bg-surface-2")}
            >
              {state === "failed" ? copy.tryAgain : view.primary.label}
            </Button>
            {view.secondary && state === "ready" && (
              <Button variant="elevated" size="lg" onClick={() => onConfirm("decline")} className={actionButton}>
                {view.secondary.label}
              </Button>
            )}
            {notNow}
          </>
        )}
      </Rise>

      <div data-tint={last ? "amber" : undefined} className={cn("-mt-1 flex items-center gap-2 border-t border-line pt-3.5 text-footnote", last ? "font-semibold text-tint" : "text-muted")}>
        <Icon name="sparkle" size={14} className="shrink-0" />
        <span className="text-pretty">{foot}</span>
      </div>
    </Rise>
  );
}
