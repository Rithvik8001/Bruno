"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BuddyPicker } from "@/components/patterns/buddy-picker";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import type { BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { EASE, T } from "@/lib/motion/tokens";
import { saveProfile } from "@/lib/people/actions";
import { DISPLAY_NAME_MAX } from "@/lib/people/schema";
import { settingsCopy } from "../_data";

const SAVED_MS = 2000;

interface Profile {
  readonly displayName: string;
  readonly buddy: BuddyShape;
  readonly tint: PaletteTint;
}

export interface ProfileSectionProps {
  initial: Profile;
  username: string | null;
  email: string;
  verified: boolean;
}

const same = (a: Profile, b: Profile) => a.displayName.trim() === b.displayName.trim() && a.buddy === b.buddy && a.tint === b.tint;

export function ProfileSection({ initial, username, email, verified }: ProfileSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const copy = settingsCopy.profile;
  const [stored, setStored] = useState(initial);
  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const dirty = !same(value, stored);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), SAVED_MS);
    return () => clearTimeout(timer);
  }, [saved]);

  const change = (next: Partial<Profile>) => {
    setValue((current) => ({ ...current, ...next }));
    setSaved(false);
    setError(undefined);
  };

  const save = async () => {
    setPending(true);
    const result = await saveProfile(value).catch(() => null);
    setPending(false);
    if (!result) {
      toast({ message: copy.failed });
      return;
    }
    if (!result.ok) {
      const field = result.error.fields?.displayName;
      if (field) setError(field);
      else toast({ message: result.error.message });
      return;
    }
    setStored({ ...value, displayName: value.displayName.trim() });
    setSaved(true);
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar name={value.displayName || stored.displayName} tint={value.tint} buddy={value.buddy} size="2xl" className="size-16" />
        <span className="grid min-w-0">
          <span className="truncate text-title">{value.displayName || stored.displayName}</span>
          {username && <span className="truncate text-small text-text-2">@{username}</span>}
        </span>
      </div>
      <BuddyPicker
        compact
        name={value.displayName || stored.displayName}
        buddy={value.buddy}
        tint={value.tint}
        onPick={change}
        labels={{ buddy: copy.buddy, colour: copy.colour }}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={copy.name}
          name="displayName"
          autoComplete="nickname"
          maxLength={DISPLAY_NAME_MAX}
          value={value.displayName}
          onChange={(event) => change({ displayName: event.target.value })}
          feedback={error ? { tone: "error", message: error } : undefined}
          className="bg-bg"
          fieldClassName="min-w-0"
        />
        <div className="grid min-w-0 content-start gap-1.5">
          <span className="text-small font-medium">{copy.email}</span>
          <span className="flex h-12 min-w-0 items-center gap-2 rounded-control bg-bg px-3.5">
            <span className="min-w-0 flex-1 truncate">{email}</span>
            {verified && (
              <Chip tint="green" size="xs">
                {copy.verified}
              </Chip>
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <AnimatePresence>
          {saved && (
            <motion.span
              role="status"
              data-tint="green"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: T.t2, ease: EASE }}
              className="text-footnote font-semibold text-tint"
            >
              {copy.saved}
            </motion.span>
          )}
        </AnimatePresence>
        <Button disabled={!dirty || value.displayName.trim() === ""} loading={pending} onClick={save}>
          {copy.save}
        </Button>
      </div>
    </>
  );
}
