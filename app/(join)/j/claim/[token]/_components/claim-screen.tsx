"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { InlineAlert } from "@/components/ui/inline-alert";
import { routes } from "@/lib/auth/rules";
import { formatMoney } from "@/lib/currency";
import { claimGuestSpot } from "@/lib/members/actions";
import type { GuestClaimView } from "@/lib/members/queries";
import { fireConfetti } from "@/lib/motion/confetti";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { EASE, SPRING_CURVE } from "@/lib/motion/tokens";
import type { PersonView } from "@/lib/people/person";
import { firstNameOf } from "@/lib/people/defaults";
import { cn } from "@/lib/utils/cn";
import { claimCopy } from "../_data";
import { CarryList } from "./carry-list";
import { ClaimHero } from "./claim-hero";
import { OfferHeader } from "./offer-header";

const CONFETTI_DELAY_MS = 260;

export interface ClaimScreenProps {
  token: string;
  view: GuestClaimView;
  viewer: PersonView;
  addedOn: string;
}

export function ClaimScreen({ token, view, viewer, addedOn }: ClaimScreenProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const guest = firstNameOf(view.guest.displayName);
  const by = view.addedBy ? firstNameOf(view.addedBy) : null;

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => doneRef.current && fireConfetti(doneRef.current), CONFETTI_DELAY_MS);
    return () => clearTimeout(id);
  }, [done]);

  const take = () =>
    startTransition(async () => {
      buzz(HAPTICS.press);
      const result = await claimGuestSpot({ token });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setDone(true);
      router.prefetch(routes.group(view.group.id));
    });

  const moved = [
    claimCopy.done.moved(view.bills.count, view.claims, view.payments),
    view.balance.kind === "square"
      ? claimCopy.done.square
      : view.balance.kind === "owes"
        ? claimCopy.done.owes(view.balance.counterpart && firstNameOf(view.balance.counterpart), formatMoney(view.balance.amount, view.balance.currency))
        : claimCopy.done.owed(view.balance.counterpart && firstNameOf(view.balance.counterpart), formatMoney(view.balance.amount, view.balance.currency)),
    claimCopy.done.gone(guest),
  ];

  return (
    <AnimatePresence mode="wait" initial={false}>
      {done ? (
        <Rise key="done" ref={doneRef} className="grid gap-6">
          <div className="grid justify-items-center gap-4 text-center">
            <ClaimHero group={view.group} person={viewer} pop />
            <div className="grid gap-2">
              <h1 className="m-0 text-heading">{claimCopy.done.title(view.group.name)}</h1>
              <p className="m-0 text-text-2 text-pretty">{claimCopy.done.body(guest, by)}</p>
            </div>
          </div>
          <ul className="m-0 grid list-none rounded-card bg-surface px-4 py-1.5">
            {moved.map((text, i) => (
              <li key={text} className={cn("flex min-h-13 items-center gap-3", i > 0 && "border-t border-line")}>
                <motion.span
                  data-tint="green"
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-tint-bg text-tint"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: [0, 1.2, 1], rotate: [-30, 6, 0] }}
                  transition={{ duration: 0.42, delay: 0.36 + i * 0.12, ease: SPRING_CURVE }}
                >
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <motion.path
                      d="M5 12l5 5L20 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.36, delay: 0.36 + i * 0.12, ease: EASE }}
                    />
                  </svg>
                </motion.span>
                <span className="text-small">{text}</span>
              </li>
            ))}
          </ul>
          <PressLink wide href={routes.group(view.group.id)} className={cn(buttonVariants({ size: "lg", fullWidth: true }), "h-13")}>
            {claimCopy.done.open(view.group.name)}
          </PressLink>
        </Rise>
      ) : (
        <Rise key="offer" className="grid gap-6">
          <OfferHeader view={view} />
          <CarryList view={view} addedOn={addedOn} />
          {error && <InlineAlert>{error}</InlineAlert>}
          <div className="grid gap-2">
            <Button size="lg" fullWidth loading={pending} onClick={take} className="h-13">
              {claimCopy.take}
            </Button>
            <PressLink wide href={routes.invite(view.group.slug)} className={cn(buttonVariants({ variant: "tertiary", fullWidth: true }), "h-11 text-small text-text-2")}>
              {claimCopy.notYou}
            </PressLink>
            <p className="m-0 mt-1 text-center text-footnote text-muted">{claimCopy.oneUse}</p>
          </div>
        </Rise>
      )}
    </AnimatePresence>
  );
}
