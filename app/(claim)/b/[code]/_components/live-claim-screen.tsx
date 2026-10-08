"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { PopIn } from "@/app/(flow)/_components/pop-in";
import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { PressLink } from "@/components/motion/motion-link";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { BackLink } from "@/components/patterns/back-link";
import { ClaimRow } from "@/components/patterns/claim-row";
import { Avatar } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Chip } from "@/components/ui/chip";
import { PushOptInCard } from "@/components/pwa/push-opt-in-card";
import { GroupArtTile } from "@/components/ui/icon-3d";
import { Receipt } from "@/components/ui/receipt";
import { RollingNumber } from "@/components/ui/rolling-number";
import { useToast } from "@/components/ui/toast";
import { routes } from "@/lib/auth/rules";
import {
  finishClaiming,
  joinAsGuest,
  leaveGuestSession,
  remindClaimers,
  splitRest,
  toggleClaim,
} from "@/lib/claiming/actions";
import type { ClaimingBill } from "@/lib/claiming/queries";
import type { JoinAsGuestInput } from "@/lib/claiming/schema";
import { currencySymbol, formatAmount, formatMoney } from "@/lib/currency";
import { personId, type PersonId } from "@/lib/domain/ids";
import { fireConfetti } from "@/lib/motion/confetti";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SOFT_SPRING } from "@/lib/motion/tokens";
import { ZERO_CENTS } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import { optInCopy } from "@/lib/pwa/messages";
import type { ClaimSignal } from "@/lib/realtime/topics";
import { cn } from "@/lib/utils/cn";
import { liveClaimCopy } from "../_data";
import { useLiveChannel, type PresentPerson } from "../_lib/use-live-channel";
import { applyToggle, claimMapOf, nameFor, peopleOf, summaryOf } from "../_lib/view";
import { PresenceRow } from "./presence-row";
import { ShareBar } from "./share-bar";
import { WhoAreYouSheet } from "./who-are-you-sheet";

export interface LiveClaimScreenProps {
  bill: ClaimingBill;
  dayLabel: string;
}

const REMIND_LIMIT = 3;

const calloutButton =
  "inline-flex h-10 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-control bg-bg px-2.5 text-footnote font-semibold whitespace-nowrap text-text shadow-float disabled:cursor-progress";

export function LiveClaimScreen({ bill, dayLabel }: LiveClaimScreenProps) {
  const copy = liveClaimCopy;
  const router = useRouter();
  const { toast } = useToast();
  const viewer = bill.viewer;
  const you: PersonId | null = viewer ? personId(viewer.person.id) : null;
  const manager = bill.canManage;
  const guestView = !viewer || viewer.kind === "guest";
  const outsider = viewer?.kind === "joining";
  const payerName = firstNameOf(bill.payer.displayName);

  const [claims, addOptimistic] = useOptimistic(claimMapOf(bill.items), applyToggle);
  const [, startClaim] = useTransition();
  const [joining, startJoin] = useTransition();
  const [finishing, startFinish] = useTransition();
  const [splitting, startSplit] = useTransition();
  const [reminding, startRemind] = useTransition();
  const [whoOpen, setWhoOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [removedGuests, setRemovedGuests] = useState<readonly string[]>([]);
  const [nudges, setNudges] = useState(0);
  const [joinedGroup, setJoinedGroup] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const statusRef = useRef<HTMLSpanElement>(null);

  const me: PresentPerson | null = viewer
    ? { id: viewer.person.id, name: viewer.person.displayName, tint: viewer.person.tint, buddy: viewer.person.buddy }
    : null;

  const onSignal = useCallback(
    (signal: ClaimSignal) => {
      if (!manager || signal.personId === you) return;
      if (signal.joined) toast({ message: copy.live.joined(signal.name) });
      else if (signal.on && signal.item) toast({ message: copy.live.grabbed(signal.name, signal.item) });
    },
    [copy.live, manager, toast, you],
  );
  const channel = useLiveChannel(bill.code, me, onSignal);

  const people = useMemo(() => peopleOf(bill.items, [viewer?.person ?? null, bill.payer]), [bill.items, viewer, bill.payer]);
  const summary = summaryOf(bill.items, claims, bill.charges);
  const share = you ? summary.shareOf(you) : { total: ZERO_CENTS, extras: ZERO_CENTS };
  const total = bill.items.length;
  const progress = total === 0 ? 0 : Math.round((summary.claimed / total) * 100);
  const allClaimed = total > 0 && summary.unclaimedIds.length === 0;
  const mineCount = you ? bill.items.filter((item) => (claims[item.id] ?? []).includes(you)).length : 0;
  const discounted = bill.charges.discountCents > 0;
  const currency = bill.currency;
  const guests = bill.guests.filter((guest) => !removedGuests.includes(guest.id));
  const waiting = bill.waitingOn.map((person) => firstNameOf(person.displayName));
  const guestDone = guestView && confirmed && mineCount > 0;

  const wasReady = useRef(allClaimed);
  useEffect(() => {
    if (allClaimed && !wasReady.current && manager) {
      buzz(HAPTICS.celebrate);
      if (statusRef.current) fireConfetti(statusRef.current);
      toast({ message: copy.footer.allClaimed });
    }
    wasReady.current = allClaimed;
  }, [allClaimed, copy.footer.allClaimed, manager, toast]);

  const toggle = (itemId: string) => {
    if (!you) {
      setPendingItem(itemId);
      setJoinError(null);
      setWhoOpen(true);
      return;
    }
    const on = !(claims[itemId] ?? []).includes(you);
    startClaim(async () => {
      addOptimistic({ itemId, person: you, on });
      const result = await toggleClaim({ code: bill.code, lineItemId: itemId, on });
      if (!result.ok) {
        toast({ message: result.error.message });
        if (result.error.code === "unauthorized") setWhoOpen(true);
        return;
      }
      if (result.data.joined) {
        setJoinedGroup(true);
        toast({ message: copy.footer.joined(bill.group.name) });
      }
    });
  };

  const pick = (choice: JoinAsGuestInput["pick"]) => {
    setPicking(choice.kind === "existing" ? choice.guestId : null);
    startJoin(async () => {
      setJoinError(null);
      const joined = await joinAsGuest({ code: bill.code, pick: choice });
      setPicking(null);
      if (!joined.ok) {
        buzz(HAPTICS.error);
        if (choice.kind === "existing" && joined.error.code === "notFound") {
          setRemovedGuests((current) => [...current, choice.guestId]);
        }
        setJoinError(joined.error.fields?.["pick.name"] ?? joined.error.message);
        return;
      }
      setWhoOpen(false);
      const item = pendingItem;
      setPendingItem(null);
      if (!item) return;
      addOptimistic({ itemId: item, person: personId(joined.data.personId), on: true });
      const claimed = await toggleClaim({ code: bill.code, lineItemId: item, on: true });
      if (!claimed.ok) toast({ message: claimed.error.message });
    });
  };

  const forget = () => {
    setConfirmed(false);
    startJoin(async () => {
      await leaveGuestSession({ code: bill.code });
    });
  };

  const splitLeftovers = () => {
    buzz(HAPTICS.select);
    startSplit(async () => {
      const result = await splitRest({ billId: bill.id });
      if (!result.ok) toast({ message: result.error.message });
    });
  };

  const finish = () => {
    startFinish(async () => {
      const result = await finishClaiming({ billId: bill.id });
      if (!result.ok) {
        toast({ message: result.error.message });
        return;
      }
      buzz(HAPTICS.celebrate);
      toast({ message: copy.footer.finished(bill.title) });
      router.push(routes.bill(result.data.slug));
    });
  };

  const remind = () => {
    buzz(HAPTICS.select);
    if (waiting.length === 0) {
      toast({ message: copy.remind.nobody });
      return;
    }
    if (nudges >= REMIND_LIMIT) {
      toast({ message: copy.remind.enough });
      return;
    }
    startRemind(async () => {
      const result = await remindClaimers({ billId: bill.id });
      if (!result.ok) {
        toast({ message: result.error.message });
        return;
      }
      if (result.data.count === 0) {
        toast({ message: copy.remind.nobody });
        return;
      }
      const names = result.data.names;
      toast({ message: nudges === 0 ? copy.remind.sent(names) : nudges === 1 ? copy.remind.again(names) : copy.remind.final });
      setNudges((n) => Math.min(n + 1, REMIND_LIMIT));
    });
  };

  const confirmMine = () => {
    if (mineCount === 0) return;
    buzz(HAPTICS.select);
    setConfirmed(true);
    toast({ message: copy.footer.confirmed(payerName) });
  };

  const title = manager ? copy.title.manager : copy.title.other(payerName, bill.title);
  const body = manager ? copy.body.manager : guestView ? copy.body.guest : copy.body.member;

  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-5 px-5 pb-10", manager ? "pt-5" : "pt-1")}>
      <div className="flex min-h-9 items-center justify-between gap-3">
        {manager ? (
          <BackLink label={copy.back} href={routes.editBill(bill.slug, "items")} />
        ) : (
          <span className="inline-flex h-9 min-w-0 items-center gap-2 text-small font-medium text-text-2">
            <GroupArtTile name={bill.group.name} tint={bill.group.tint} art={bill.group.art} size="2xs" />
            <span className="truncate">{bill.group.name}</span>
          </span>
        )}
        <span ref={statusRef} className="inline-flex">
          <PopIn popKey={allClaimed ? "ready" : "claiming"}>
            <Chip tint={allClaimed ? "green" : "orange"} size="sm" dot role="status">
              {allClaimed ? copy.status.ready : copy.status.claiming}
            </Chip>
          </PopIn>
        </span>
      </div>

      <div className="grid gap-1.5">
        <h1 className="m-0 text-heading text-balance">{title}</h1>
        <p className="m-0 text-text-2 text-pretty">{body}</p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
        <ShareBar url={bill.shareUrl} label={bill.shareLabel} place={bill.title} />
        <div className="grid gap-1.5 px-1">
          <PresenceRow people={channel.present} me={me} online={channel.connected} />
          <AnimatePresence initial={false} mode="popLayout">
            {viewer?.kind === "guest" && (
              <Rise key="identity" className="flex min-h-7 items-center gap-1.5 text-footnote text-text-2">
                <span>
                  {copy.identity.as} <span className="font-semibold text-text">{viewer.person.displayName}</span>
                </span>
                <span className="text-muted">·</span>
                <motion.button
                  type="button"
                  onClick={forget}
                  disabled={joining}
                  {...pressMotion()}
                  className="-ml-1 h-7 cursor-pointer rounded-xs bg-transparent px-1.5 font-semibold text-brand transition-colors hover:bg-brand-tint"
                >
                  {copy.identity.notYou}
                </motion.button>
              </Rise>
            )}
            {outsider && !joinedGroup && (
              <Rise key="hint" className="flex min-h-7 items-center gap-2 text-footnote text-text-2">
                <GroupArtTile name={bill.group.name} tint={bill.group.tint} art={bill.group.art} size="3xs" />
                <span>{copy.outsider.hint(bill.group.name)}</span>
              </Rise>
            )}
            {joinedGroup && (
              <Rise key="joined" className="flex min-h-7 items-center gap-2 text-footnote font-medium text-green">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-green-bg">
                  <CheckIn className="inline-grid">
                    <Icon name="check" size={11} strokeWidth={3.2} />
                  </CheckIn>
                </span>
                <span>{copy.outsider.joined(bill.group.name)}</span>
              </Rise>
            )}
          </AnimatePresence>
        </div>
      </div>

      {manager && <PushOptInCard copy={optInCopy.claim} snoozeKey="optIn:claim" />}

      <Receipt bodyClassName="grid px-4 pt-2 pb-4">
        <div className="flex items-center justify-between gap-3 pt-1.5 pb-2.5">
          <span className="grid min-w-0">
            <span className="truncate font-semibold">{bill.title}</span>
            <span className="text-caption font-normal text-muted">
              {copy.receipt.paidBy(dayLabel, nameFor(personId(bill.payer.id), people, you, copy.you.toLowerCase()))}
            </span>
          </span>
          <span
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={copy.receipt.progress(summary.claimed, total)}
            className="h-1.5 w-30 shrink-0 overflow-hidden rounded-full bg-surface-2"
          >
            <motion.span
              className="block h-full origin-left rounded-full bg-brand"
              initial={false}
              animate={{ scaleX: progress / 100 }}
              transition={SOFT_SPRING}
            />
          </span>
        </div>
        {bill.items.map((item, index) => {
          const claimants = claims[item.id] ?? [];
          const line = summary.lines[index];
          const claimed = claimants.length > 0;
          return (
            <ClaimRow
              key={item.id}
              name={item.name}
              quantity={item.quantity}
              price={formatAmount(item.price, currency)}
              each={line?.each ? copy.receipt.each(formatAmount(line.each, currency)) : null}
              caption={claimed ? claimants.map((id) => nameFor(id, people, you, copy.you)).join(", ") : copy.receipt.tapHint}
              claimed={claimed}
              mine={you !== null && claimants.includes(you)}
              faces={claimants.flatMap((id) => {
                const person = people.get(id);
                return person ? [person] : [];
              })}
              onToggle={() => toggle(item.id)}
            />
          );
        })}
        <div className="mt-1 grid gap-1 border-t border-border pt-3 text-small text-text-2">
          <div className="flex justify-between gap-3">
            <span>{copy.receipt.extras(discounted)}</span>
            <span>{formatAmount(summary.extras, currency)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>{copy.receipt.extrasShare}</span>
            <span>{formatAmount(share.extras, currency)}</span>
          </div>
        </div>
      </Receipt>

      <AnimatePresence initial={false}>
        {manager && summary.unclaimedIds.length > 0 && (
          <Rise key="unclaimed" className="grid gap-3 rounded-tile bg-surface px-4 pt-3.5 pb-4 text-small">
            <div className="flex items-start gap-3">
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="font-semibold">
                  {copy.unclaimed.title(summary.unclaimedIds.length, formatMoney(summary.unclaimedTotal, currency))}
                </span>
                <span className="text-footnote text-text-2 text-pretty">
                  {waiting.length > 0 ? copy.unclaimed.waiting(waiting) : copy.unclaimed.allIn}
                </span>
              </span>
              {bill.waitingOn.length > 0 && (
                <AvatarStack
                  size="sm"
                  max={3}
                  people={bill.waitingOn.map((person) => ({
                    id: person.id,
                    name: firstNameOf(person.displayName),
                    tint: person.tint,
                    buddy: person.buddy,
                  }))}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                onClick={remind}
                disabled={reminding}
                aria-busy={reminding || undefined}
                {...pressMotion()}
                className={cn(calloutButton, nudges >= REMIND_LIMIT && "text-text-2")}
              >
                <Icon name="bell" size={15} strokeWidth={2} className="shrink-0" />
                {waiting.length > 0 ? copy.remind.labels[nudges] : copy.remind.labels[0]}
              </motion.button>
              <motion.button
                type="button"
                onClick={splitLeftovers}
                disabled={splitting}
                aria-busy={splitting || undefined}
                {...pressMotion()}
                className={calloutButton}
              >
                <Icon name="split" size={15} strokeWidth={2} className="shrink-0" />
                {copy.unclaimed.splitRest}
              </motion.button>
            </div>
          </Rise>
        )}
      </AnimatePresence>

      {manager && (
        <PressLink
          wide
          href={routes.editBill(bill.slug, "split")}
          className="flex w-full items-center gap-3 rounded-tile bg-surface px-4 py-3.5 text-left text-small text-text no-underline transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-text"
        >
          <span data-tint="indigo" className="grid size-8 shrink-0 place-items-center rounded-control bg-tint-bg text-tint">
            <Icon name="align-left" size={16} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{copy.editor.title}</span>
            <span className="block text-footnote text-text-2">{copy.editor.body}</span>
          </span>
          <Icon name="chevron-right" size={18} className="text-muted" />
        </PressLink>
      )}

      <div className="grid gap-3 pt-2">
        <div className="flex items-center gap-3">
          <span className="grid min-w-0 flex-1">
            <span className="text-footnote text-text-2">{copy.footer.share}</span>
            <span className="flex text-title font-semibold">
              <span>{currencySymbol(currency)}</span>
              <RollingNumber speed="live" value={formatAmount(share.total, currency, "never")} />
            </span>
          </span>
          {manager ? (
            <Button size="lg" loading={finishing} onClick={finish}>
              {allClaimed ? copy.footer.finish : copy.footer.finishAnyway}
            </Button>
          ) : guestView ? (
            guestDone ? (
              <Rise className="inline-flex h-9 items-center gap-1.5 rounded-control bg-green-bg pr-3 pl-2 text-small font-semibold whitespace-nowrap text-green">
                <CheckIn className="inline-grid">
                  <Icon name="check" size={16} strokeWidth={2.6} />
                </CheckIn>
                {copy.footer.youreIn}
              </Rise>
            ) : (
              <Button size="lg" disabled={mineCount === 0} onClick={confirmMine}>
                {copy.footer.mine}
              </Button>
            )
          ) : (
            <PressLink href={routes.group(bill.group.id)} className={cn(buttonVariants({ size: "lg" }))}>
              {copy.footer.done}
            </PressLink>
          )}
        </div>
        <AnimatePresence initial={false}>
          {guestDone && (
            <Rise key="waiting" delay={0.06} className="flex items-center gap-3 rounded-tile bg-surface px-3.5 py-3">
              <Avatar
                name={bill.payer.displayName}
                tint={bill.payer.tint}
                buddy={bill.payer.buddy}
                size="sm"
                className="size-7"
              />
              <span className="grid min-w-0 text-small">
                <span className="font-medium">{copy.footer.waitingTitle(payerName)}</span>
                <span className="text-footnote text-text-2">{copy.footer.waitingBody}</span>
              </span>
            </Rise>
          )}
        </AnimatePresence>
      </div>

      <WhoAreYouSheet
        open={whoOpen}
        code={bill.code}
        groupName={bill.group.name}
        guests={guests}
        picking={picking}
        pending={joining}
        error={joinError}
        onPick={pick}
        onOpenChange={(open) => {
          setWhoOpen(open);
          if (!open) {
            setPendingItem(null);
            setJoinError(null);
          }
        }}
      />
    </div>
  );
}
