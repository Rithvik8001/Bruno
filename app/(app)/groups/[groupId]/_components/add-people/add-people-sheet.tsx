"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { addGuest, addMember, lookupPerson } from "@/lib/members/actions";
import { guessName } from "@/lib/members/names";
import { parseLookupQuery } from "@/lib/members/schema";
import type { LookupResult } from "@/lib/members/types";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SHAKE } from "@/lib/motion/keyframes";
import { SPRING } from "@/lib/motion/tokens";
import type { PersonView } from "@/lib/people/person";
import { firstNameOf } from "@/lib/people/defaults";
import { groupDetailCopy } from "../../_data";
import { CopyLinkButton } from "@/components/patterns/copy-link-button";
import { FoundCard, type FoundState } from "./found-card";
import { GuestForm, type GuestDraft } from "./guest-form";
import { NotFoundCard } from "./not-found-card";

type Phase =
  | { readonly kind: "idle" }
  | { readonly kind: "notFound"; readonly query: string }
  | { readonly kind: "match"; readonly result: Exclude<LookupResult, { status: "none" }>; readonly state: FoundState; readonly key: string };

interface AddedChip {
  readonly person: PersonView;
  readonly guest: boolean;
}

export interface AddPeopleSheetProps {
  groupId: string;
  groupName: string;
  inviteUrl: string;
  inviteLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPeopleSheet(props: AddPeopleSheetProps) {
  return props.open ? <AddPeopleBody {...props} /> : <Sheet open={false} onOpenChange={props.onOpenChange} title="" />;
}

function AddPeopleBody({ groupId, groupName, inviteUrl, inviteLabel, onOpenChange }: AddPeopleSheetProps) {
  const copy = groupDetailCopy.addPeople;
  const router = useRouter();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<"lookup" | "name">("lookup");
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<readonly AddedChip[]>([]);
  const [nameSeed, setNameSeed] = useState("");
  const [looking, startLookup] = useTransition();
  const [adding, startAdding] = useTransition();
  const cooldown = useCooldown(0, false);
  const cache = useRef(new Map<string, LookupResult>());
  const seq = useRef(0);
  const dirty = useRef(false);
  const [field, animateField] = useAnimate<HTMLDivElement>();

  const close = () => {
    if (dirty.current) router.refresh();
    onOpenChange(false);
  };

  const show = (result: LookupResult, key: string, raw: string) => {
    if (result.status === "none") {
      setPhase({ kind: "notFound", query: raw });
      return;
    }
    const state: FoundState = result.status === "member" ? "member" : result.status;
    setPhase({ kind: "match", result, state, key });
  };

  const shake = () => {
    buzz(HAPTICS.error);
    if (!reduce && field.current) void animateField(field.current, SHAKE.keyframes, SHAKE.transition);
  };

  const find = (event: FormEvent) => {
    event.preventDefault();
    const raw = query.trim();
    if (!raw) return shake();
    const parsed = parseLookupQuery(raw);
    if (!parsed) return setPhase({ kind: "notFound", query: raw });
    const key = `${parsed.kind}:${parsed.value}`;
    const cached = cache.current.get(key);
    if (cached) return show(cached, key, raw);
    if (cooldown.active || looking) return;

    buzz(HAPTICS.press);
    setError(null);
    const id = ++seq.current;
    startLookup(async () => {
      const result = await lookupPerson({ groupId, query: raw });
      if (id !== seq.current) return;
      if (!result.ok) {
        if (result.error.code === "rateLimited") cooldown.restart(result.error.retryAfter ?? 60);
        else setError(result.error.message);
        setPhase({ kind: "idle" });
        return;
      }
      cache.current.set(key, result.data);
      show(result.data, key, raw);
    });
  };

  const onQueryChange = (value: string) => {
    seq.current += 1;
    setQuery(value);
    setError(null);
    if (phase.kind !== "idle") setPhase({ kind: "idle" });
  };

  const addFound = () => {
    if (phase.kind !== "match" || !("ticket" in phase.result)) return;
    const { ticket, person } = phase.result;
    const key = phase.key;
    startAdding(async () => {
      const result = await addMember({ groupId, ticket });
      if (!result.ok) {
        setError(result.error.message);
        cache.current.delete(key);
        return;
      }
      buzz(HAPTICS.select);
      dirty.current = true;
      cache.current.set(key, { status: "member", person });
      setPhase((current) => (current.kind === "match" ? { ...current, state: "added" } : current));
      setQuery("");
      if (result.data.added) setAdded((chips) => [...chips, { person: result.data.person, guest: false }]);
    });
  };

  const submitGuest = (draft: GuestDraft) =>
    new Promise<boolean>((resolve) => {
      startAdding(async () => {
        const result = await addGuest({ groupId, name: draft.name, buddy: draft.buddy, tint: draft.tint });
        if (!result.ok) {
          setError(result.error.message);
          resolve(false);
          return;
        }
        buzz(HAPTICS.select);
        dirty.current = true;
        setError(null);
        setAdded((chips) => [...chips, { person: result.data.person, guest: true }]);
        resolve(true);
      });
    });

  const toName = (seed: string) => {
    setNameSeed(seed);
    setError(null);
    setMode("name");
  };

  const toLookup = () => {
    setError(null);
    setMode("lookup");
  };

  const rateLimited = cooldown.active;

  return (
    <Sheet open onOpenChange={(next) => (next ? undefined : close())} title={copy.title(groupName)} className="max-w-105">
      {mode === "name" && (
        <motion.button
          type="button"
          onClick={toLookup}
          {...pressMotion()}
          className="-mt-3 inline-flex h-8 cursor-pointer items-center gap-1 justify-self-start rounded-sm pr-2 pl-1 text-small font-medium text-text-2 hover:bg-surface hover:text-text"
        >
          <Icon name="chevron-left" size={16} />
          {copy.backToLookup}
        </motion.button>
      )}

      <AnimatePresence initial={false}>
        {added.length > 0 && (
          <Rise className="grid gap-2">
            <span className="text-footnote font-semibold text-muted">{copy.justAdded}</span>
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence initial={false}>
                {added.map(({ person, guest }) => (
                  <motion.span
                    key={person.id}
                    layout
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={SPRING}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface pr-3 pl-1 text-footnote font-semibold"
                  >
                    <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="md" className="size-6" />
                    {firstNameOf(person.displayName)}
                    {guest && <span className="font-medium text-text-2">· {copy.guestTag}</span>}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </Rise>
        )}
      </AnimatePresence>

      {mode === "lookup" ? (
        <div className="grid gap-4">
          <form onSubmit={find} noValidate className="grid gap-1.5">
            <label htmlFor="add-people-query" className="text-small font-medium">
              {copy.queryLabel}
            </label>
            <div ref={field} className="flex gap-2">
              <input
                id="add-people-query"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder={copy.queryPlaceholder}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                enterKeyHint="search"
                maxLength={254}
                className="h-12 min-w-0 flex-1 rounded-control border border-transparent bg-surface px-3.5 text-body outline-none transition-[background-color,border-color,box-shadow] duration-150 ease-standard placeholder:text-muted focus:border-brand focus:bg-bg focus:shadow-[0_0_0_3px_var(--brand-tint)]"
              />
              <Button type="submit" size="lg" disabled={rateLimited} loading={looking} className="min-w-0 px-4">
                {copy.find}
              </Button>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {looking ? (
                <Rise key="looking" role="status" className="flex items-center gap-2 text-footnote text-text-2">
                  <Spinner className="size-3.5 border-brand border-r-transparent" />
                  {copy.looking}
                </Rise>
              ) : rateLimited ? (
                <Rise key="rate" role="status" data-tint="amber" className="flex items-center gap-2 text-footnote font-medium text-tint">
                  <Icon name="clock" size={14} strokeWidth={2.2} />
                  {copy.rateLimited}
                </Rise>
              ) : (
                <Rise key="helper" className="text-footnote text-text-2">
                  {copy.helper}
                </Rise>
              )}
            </AnimatePresence>
          </form>

          {error && <InlineAlert>{error}</InlineAlert>}

          <AnimatePresence mode="wait" initial={false}>
            {phase.kind === "match" && (
              <motion.div key={`match-${phase.key}`} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                <FoundCard person={phase.result.person} state={phase.state} groupName={groupName} pending={adding} onAdd={addFound} />
              </motion.div>
            )}
            {phase.kind === "notFound" && (
              <motion.div key={`none-${phase.query}`} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                <NotFoundCard
                  query={phase.query}
                  guess={guessName(phase.query)}
                  inviteUrl={inviteUrl}
                  onAddByName={() => toName(guessName(phase.query))}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {phase.kind !== "notFound" && (
            <motion.button
              type="button"
              onClick={() => toName("")}
              {...pressMotion(true)}
              className="grid cursor-pointer grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-tile bg-surface px-3.5 py-3 text-left transition-colors hover:bg-surface-2"
            >
              <span className="grid size-9 place-items-center rounded-control bg-bg text-text-2">
                <Icon name="user" size={18} />
              </span>
              <span className="text-small">
                <span className="block font-semibold">{copy.addByName}</span>
                <span className="block text-small text-text-2">{copy.notOnBruno}</span>
              </span>
              <Icon name="chevron-right" size={18} className="text-muted" />
            </motion.button>
          )}

          <div className="grid gap-2 border-t border-line pt-4">
            <span className="text-footnote font-semibold text-muted">{copy.shareLink}</span>
            <div className="flex items-center gap-3 rounded-tile bg-surface py-1.5 pr-1.5 pl-4">
              <span className="min-w-0 flex-1 truncate text-small text-text-2">{inviteLabel}</span>
              <CopyLinkButton url={inviteUrl} label={copy.copy} copiedLabel={groupDetailCopy.copied} variant="floating" />
            </div>
          </div>
        </div>
      ) : (
        <GuestForm initialName={nameSeed} pending={adding} error={error} onSubmit={submitGuest} />
      )}
    </Sheet>
  );
}

