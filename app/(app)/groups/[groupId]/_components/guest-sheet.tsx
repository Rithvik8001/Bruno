"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { pressMotion } from "@/components/motion/press";
import { BuddyPicker, type BuddyPick } from "@/components/patterns/buddy-picker";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Sheet } from "@/components/ui/sheet";
import { routes } from "@/lib/auth/rules";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { buddyShapeFor, buddyShapes } from "@/lib/design-system/buddies";
import { removeMember } from "@/lib/groups/actions";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { createGuestInvite, updateGuest } from "@/lib/members/actions";
import { normalizeName } from "@/lib/members/names";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SQUISH } from "@/lib/motion/keyframes";
import { EASE, T } from "@/lib/motion/tokens";
import { cents, type Cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { cn } from "@/lib/utils/cn";
import { GUEST_CLAIM_LINKS, groupDetailCopy } from "../_data";

const SAVE_DELAY_MS = 600;
const COPIED_MS = 2000;

export interface GuestTarget {
  readonly person: PersonView;
  readonly addedBy: string;
  readonly net: Cents;
  readonly canRemove: boolean;
}

export interface GuestSheetProps {
  groupId: string;
  groupName: string;
  currency: CurrencyCode;
  target: GuestTarget | null;
  onClose: () => void;
}

export function GuestSheet(props: GuestSheetProps) {
  if (!props.target) return null;
  return <GuestSheetBody key={props.target.person.id} {...props} target={props.target} />;
}

type Panel = "rename" | "buddy" | "confirm" | null;

function GuestSheetBody({ groupId, groupName, currency, target, onClose }: GuestSheetProps & { target: GuestTarget }) {
  const copy = groupDetailCopy.guestSheet;
  const router = useRouter();
  const reduce = useReducedMotion();
  const [person, setPerson] = useState(target.person);
  const [panel, setPanel] = useState<Panel>(null);
  const [renameValue, setRenameValue] = useState(target.person.displayName);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [avatar, animateAvatar] = useAnimate<HTMLSpanElement>();

  const persist = useDebouncedCallback((pick: BuddyPick) => {
    void updateGuest({ groupId, personId: person.id, ...pick }).then((result) => {
      if (!result.ok) setError(result.error.message);
    });
  }, SAVE_DELAY_MS);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(id);
  }, [copied]);

  const close = () => {
    persist.flush();
    router.refresh();
    onClose();
  };

  const locked = target.net !== 0;
  const first = firstNameOf(person.displayName);
  const current = { buddy: buddyShapeFor(person.displayName, person.buddy), tint: person.tint };

  const pick = (next: BuddyPick) => {
    const merged = { buddy: next.buddy ?? current.buddy, tint: next.tint ?? current.tint };
    setPerson((prev) => ({ ...prev, ...merged }));
    persist.run(merged);
    if (!reduce && avatar.current) void animateAvatar(avatar.current, SQUISH.keyframes, SQUISH.transition);
  };

  const rename = (event: FormEvent) => {
    event.preventDefault();
    const name = normalizeName(renameValue);
    if (!name || name === person.displayName) return setPanel(null);
    startTransition(async () => {
      const result = await updateGuest({ groupId, personId: person.id, name });
      if (!result.ok) return setError(result.error.message);
      buzz(HAPTICS.select);
      setError(null);
      setPerson(result.data.person);
      setPanel(null);
    });
  };

  const invite = () =>
    startTransition(async () => {
      let url = inviteUrl;
      if (!url) {
        const result = await createGuestInvite({ groupId, personId: person.id });
        if (!result.ok) return setError(result.error.message);
        url = result.data.url;
        setInviteUrl(url);
      }
      try {
        await navigator.clipboard.writeText(url);
        buzz(HAPTICS.select);
        setCopied(true);
      } catch {
        setError(url);
      }
    });

  const remove = () =>
    startTransition(async () => {
      persist.cancel();
      const result = await removeMember({ groupId, personId: person.id });
      if (!result.ok) return setError(result.error.message);
      buzz(HAPTICS.select);
      router.refresh();
      onClose();
    });

  const balance = locked
    ? target.net < 0
      ? copy.owes(formatMoney(cents(-target.net), currency))
      : copy.owed(formatMoney(target.net, currency))
    : null;

  return (
    <Sheet open onOpenChange={(open) => (open ? undefined : close())} title={person.displayName} className="max-w-105">
      <div className="-mt-2 grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3.5">
        <span ref={avatar} className="block origin-bottom">
          <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="2xl" />
        </span>
        <span className="grid min-w-0 gap-1">
          <Chip tint="neutral" size="sm" className="justify-self-start">
            {groupDetailCopy.members.guest}
          </Chip>
          <span className="truncate text-small text-text-2">{copy.role(target.addedBy)}</span>
        </span>
      </div>

      {balance && (
        <div data-tint={target.net < 0 ? "red" : "green"} className="flex items-center justify-between rounded-tile bg-tint-bg px-4 py-3 text-small font-semibold text-tint">
          {balance}
        </div>
      )}

      {error && <InlineAlert>{error}</InlineAlert>}

      <div className="grid rounded-card bg-surface px-1 [&>*+*]:border-t [&>*+*]:border-line">
        <ActionRow icon="pencil" title={copy.rename} sub={copy.renameSub} expanded={panel === "rename"} onClick={() => setPanel(panel === "rename" ? null : "rename")} />
        <Collapse open={panel === "rename"}>
          <form onSubmit={rename} className="flex gap-2 px-3 pb-3">
            <input
              aria-label={copy.renameLabel}
              value={renameValue}
              maxLength={24}
              autoComplete="off"
              onChange={(e) => setRenameValue(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-control border border-transparent bg-bg px-3 outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-tint)]"
            />
            <Button type="submit" size="md" loading={pending && panel === "rename"} className="h-11">
              {copy.save}
            </Button>
          </form>
        </Collapse>

        <ActionRow
          icon="sparkle"
          title={copy.buddy}
          sub={copy.buddySub(buddyShapes[current.buddy].name, person.tint)}
          expanded={panel === "buddy"}
          onClick={() => setPanel(panel === "buddy" ? null : "buddy")}
        />
        <Collapse open={panel === "buddy"}>
          <BuddyPicker
            compact
            name={person.displayName}
            buddy={current.buddy}
            tint={person.tint}
            onPick={pick}
            labels={{ buddy: groupDetailCopy.addPeople.buddyLabel, colour: groupDetailCopy.addPeople.colourLabel }}
            className="px-3 pb-3"
          />
        </Collapse>

        {GUEST_CLAIM_LINKS && (
          <ActionRow
            icon="link"
            title={
              copied ? (
                <span className="inline-flex items-center gap-1.5 text-green">
                  <CheckIn className="inline-grid">
                    <Icon name="check" size={14} strokeWidth={2.4} />
                  </CheckIn>
                  {copy.inviteCopied}
                </span>
              ) : (
                copy.invite
              )
            }
            sub={copy.inviteSub(first)}
            onClick={invite}
          />
        )}

        <ActionRow
          icon="close"
          danger={!locked && target.canRemove}
          disabled={locked || !target.canRemove}
          title={copy.remove(groupName)}
          sub={locked ? copy.removeLocked : target.canRemove ? copy.removeSub : copy.removeNotAllowed}
          onClick={() => setPanel("confirm")}
        />
      </div>

      {locked && (
        <div className="flex items-center justify-between gap-3 text-small text-text-2">
          <span>{copy.lockReason(first)}</span>
          <Link href={routes.groupTab(groupId, "balances")} onClick={close} className="shrink-0 font-semibold">
            {copy.settleUp}
          </Link>
        </div>
      )}

      <AnimatePresence initial={false}>
        {panel === "confirm" && !locked && target.canRemove && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: T.t3, ease: EASE }}
            data-tint="red"
            className="grid gap-3 rounded-tile bg-tint-bg p-4"
          >
            <span className="text-small text-text">{copy.confirmRemove(person.displayName, groupName)}</span>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" loading={pending} onClick={remove}>
                {copy.confirmYes(first)}
              </Button>
              <Button variant="tertiary" size="sm" onClick={() => setPanel(null)}>
                {copy.keep}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: T.t3, ease: EASE }}
          className="overflow-hidden border-t-0!"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ActionRowProps {
  icon: IconName;
  title: ReactNode;
  sub: string;
  onClick: () => void;
  expanded?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

function ActionRow({ icon, title, sub, onClick, expanded, danger = false, disabled = false }: ActionRowProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={expanded}
      {...(disabled ? {} : pressMotion(true))}
      className={cn(
        "grid min-h-15 w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 text-left",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <span
        data-tint={danger ? "red" : undefined}
        className={cn("grid size-9 place-items-center rounded-control", danger ? "bg-tint-bg text-tint" : "bg-bg text-text-2")}
      >
        <Icon name={icon} size={18} />
      </span>
      <span className="grid min-w-0">
        <span className={cn("font-medium", danger ? "text-red" : disabled ? "text-muted" : "text-text")}>{title}</span>
        <span className="text-footnote text-text-2">{sub}</span>
      </span>
      {expanded !== undefined && (
        <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: T.t2, ease: EASE }} className="grid text-muted">
          <Icon name="chevron-right" size={18} />
        </motion.span>
      )}
    </motion.button>
  );
}
