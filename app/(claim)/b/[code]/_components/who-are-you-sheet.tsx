"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { inputClassName } from "@/components/ui/text-field";
import { routes } from "@/lib/auth/rules";
import { signInPath } from "@/lib/auth/redirect";
import type { JoinAsGuestInput } from "@/lib/claiming/schema";
import { normalizeName } from "@/lib/members/names";
import { EASE, T } from "@/lib/motion/tokens";
import type { PersonView } from "@/lib/people/person";
import { cn } from "@/lib/utils/cn";
import { liveClaimCopy } from "../_data";

export interface WhoAreYouSheetProps {
  open: boolean;
  code: string;
  groupName: string;
  guests: readonly PersonView[];
  picking: string | null;
  pending: boolean;
  error: string | null;
  onPick: (pick: JoinAsGuestInput["pick"]) => void;
  onOpenChange: (open: boolean) => void;
}

const STAGGER_S = 0.055;

export function WhoAreYouSheet({
  open,
  code,
  groupName,
  guests,
  picking,
  pending,
  error,
  onPick,
  onOpenChange,
}: WhoAreYouSheetProps) {
  const copy = liveClaimCopy.who;
  const [name, setName] = useState("");
  const clean = normalizeName(name);
  const hasGuests = guests.length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!clean || pending) return;
    onPick({ kind: "new", name: clean });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.body(groupName)}
      icon={{ moment: "people" }}
      tint="violet"
      className="max-w-110"
    >
      <AnimatePresence initial={false}>
        {error && (
          <Rise key="error" role="alert" className="flex items-center gap-2 text-footnote font-medium text-red">
            <Icon name="alert" size={15} strokeWidth={2.2} className="shrink-0" />
            {error}
          </Rise>
        )}
      </AnimatePresence>

      {hasGuests && (
        <ul aria-label={copy.guestsLabel} className="m-0 grid list-none rounded-tile bg-surface p-1">
          {guests.map((guest, index) => {
            const busy = picking === guest.id;
            return (
              <motion.li
                key={guest.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: T.t3, ease: EASE, delay: index * STAGGER_S }}
              >
                <motion.button
                  type="button"
                  disabled={pending}
                  aria-busy={busy || undefined}
                  onClick={() => onPick({ kind: "existing", guestId: guest.id })}
                  {...pressMotion(true)}
                  className="grid min-h-14 w-full cursor-pointer grid-cols-[32px_minmax(0,1fr)_20px] items-center gap-3 rounded-control bg-transparent px-3 text-left transition-colors duration-150 ease-standard hover:bg-surface-2 disabled:cursor-default"
                >
                  <Avatar name={guest.displayName} tint={guest.tint} buddy={guest.buddy} size="md" />
                  <span className="truncate font-medium">{guest.displayName}</span>
                  {busy ? <Spinner className="size-4 text-brand" /> : <Icon name="chevron-right" size={18} className="text-muted" />}
                </motion.button>
              </motion.li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="grid gap-1.5">
        <label htmlFor="claim-guest-name" className="text-footnote font-medium text-text-2">
          {hasGuests ? copy.someoneElse : copy.nameLabel}
        </label>
        <div className="flex gap-2">
          <input
            id="claim-guest-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={hasGuests ? copy.placeholder.others : copy.placeholder.first}
            autoComplete="given-name"
            className={cn(inputClassName, "h-12 min-w-0 flex-1 font-medium")}
          />
          <Button type="submit" size="lg" className="min-w-0 px-4.5" disabled={!clean} loading={pending && picking === null}>
            {copy.join}
          </Button>
        </div>
      </form>

      <PressLink
        href={signInPath(routes.claimBill(code))}
        className="inline-flex h-9 items-center justify-self-center rounded-sm px-2.5 text-small font-medium text-text-2 no-underline hover:text-text"
      >
        {copy.account}&nbsp;<span className="font-semibold text-brand">{copy.signIn}</span>
      </PressLink>
    </Sheet>
  );
}
