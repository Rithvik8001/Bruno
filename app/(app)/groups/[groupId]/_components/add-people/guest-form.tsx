"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons/icon";
import { DotBurst } from "@/components/motion/bursts";
import { pressMotion } from "@/components/motion/press";
import { BuddyPicker, type BuddyPick } from "@/components/patterns/buddy-picker";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { TextField } from "@/components/ui/text-field";
import { buddyShapeFor, buddyShapes, type BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SHAKE, SQUISH } from "@/lib/motion/keyframes";
import { EASE, T } from "@/lib/motion/tokens";
import { normalizeName } from "@/lib/members/names";
import { defaultPersonTint, firstNameOf } from "@/lib/people/defaults";
import { groupDetailCopy } from "../../_data";

export interface GuestDraft {
  readonly name: string;
  readonly buddy: BuddyShape;
  readonly tint: PaletteTint;
}

export interface GuestFormProps {
  initialName: string;
  pending: boolean;
  error: string | null;
  onSubmit: (draft: GuestDraft) => Promise<boolean>;
}

export function GuestForm({ initialName, pending, error, onSubmit }: GuestFormProps) {
  const copy = groupDetailCopy.addPeople;
  const [name, setName] = useState(initialName);
  const [picked, setPicked] = useState<BuddyPick>({});
  const [picker, setPicker] = useState(false);
  const [burst, setBurst] = useState(0);
  const [avatar, animateAvatar] = useAnimate<HTMLSpanElement>();
  const [field, animateField] = useAnimate<HTMLDivElement>();
  const reduce = useReducedMotion();

  const clean = normalizeName(name);
  const seed = clean || "guest";
  const buddy = picked.buddy ?? buddyShapeFor(seed);
  const tint = picked.tint ?? defaultPersonTint(seed);
  const first = firstNameOf(clean);
  const shape = buddyShapes[buddy].name;

  const pick = (next: BuddyPick) => {
    setPicked((current) => ({ ...current, ...next }));
    setBurst((n) => n + 1);
    if (!reduce && avatar.current) void animateAvatar(avatar.current, SQUISH.keyframes, SQUISH.transition);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!clean) {
      buzz(HAPTICS.error);
      if (!reduce && field.current) void animateField(field.current, SHAKE.keyframes, SHAKE.transition);
      return;
    }
    const ok = await onSubmit({ name: clean, buddy, tint });
    if (ok) {
      setName("");
      setPicked({});
      setPicker(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5">
        <motion.button
          type="button"
          aria-label={copy.changeBuddy}
          aria-expanded={picker}
          onClick={() => setPicker((open) => !open)}
          {...pressMotion()}
          data-tint={tint}
          className="relative grid cursor-pointer place-items-center rounded-full"
        >
          <span ref={avatar} className="block origin-bottom">
            <Avatar name={clean || copy.nameLabel} tint={tint} buddy={buddy} size="2xl" />
          </span>
          <span className="absolute -right-0.5 -bottom-0.5 grid size-5.5 place-items-center rounded-full bg-bg text-text-2 shadow-float">
            <Icon name="pencil" size={12} strokeWidth={2.2} />
          </span>
          {burst > 0 && <DotBurst key={burst} />}
        </motion.button>
        <span className="grid min-w-0">
          <span className="truncate font-semibold">{copy.buddyTitle(first)}</span>
          <span className="text-small text-text-2">
            {picked.buddy || picked.tint ? copy.buddyPicked(shape, tint) : copy.buddyAuto(shape)}
          </span>
        </span>
      </div>

      <AnimatePresence initial={false}>
        {picker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: T.t3, ease: EASE }}
            className="overflow-hidden"
          >
            <BuddyPicker
              compact
              name={clean || copy.nameLabel}
              buddy={buddy}
              tint={tint}
              onPick={pick}
              labels={{ buddy: copy.buddyLabel, colour: copy.colourLabel }}
              className="pb-1"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={field}>
        <TextField
          label={copy.nameLabel}
          name="guestName"
          autoComplete="off"
          maxLength={24}
          placeholder={copy.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {error && <InlineAlert>{error}</InlineAlert>}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        {copy.addGuest(clean)}
      </Button>
      <p className="m-0 text-footnote text-text-2">{copy.guestNote}</p>
    </form>
  );
}
