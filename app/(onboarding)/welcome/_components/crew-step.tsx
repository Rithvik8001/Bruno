"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GroupArtTile, MomentTile } from "@/components/ui/icon-3d";
import { InlineAlert } from "@/components/ui/inline-alert";
import { TextField } from "@/components/ui/text-field";
import { groupArtFor } from "@/lib/design-system/icons3d";
import type { GroupInvite } from "@/lib/groups/queries";
import { previewInvite } from "@/lib/groups/actions";
import { cn } from "@/lib/utils/cn";
import { JoinCard } from "../../../(join)/j/[slug]/_components/join-card";
import type { GroupFormValue } from "../../../(app)/groups/_data";
import { GroupFormFields, type GroupFormErrors } from "../../../(app)/groups/_components/group-form-fields";
import { CREW_MODES, crewModes, welcomeCopy, type CrewMode } from "../_data";
import { inviteSlugFrom } from "../_lib/invite";
import { ChoiceButton } from "./choice-button";
import type { ProfileValue } from "./profile-step";

export interface CrewStepProps {
  profile: ProfileValue;
  mode: CrewMode;
  onModeChange: (mode: CrewMode) => void;
  group: GroupFormValue;
  onGroupChange: (group: GroupFormValue) => void;
  groupErrors: GroupFormErrors;
  invite: GroupInvite | null;
  onInvite: (invite: GroupInvite | null) => void;
  onSubmit: () => void;
  onBack: () => void;
  pending: boolean;
  error: string | null;
}

export function CrewStep(props: CrewStepProps) {
  const { profile, mode, onModeChange, group, onGroupChange, groupErrors, invite, onInvite, onSubmit, onBack, pending, error } = props;
  const copy = welcomeCopy.crew;
  const groupName = group.name.trim();
  const label =
    mode === "create" ? copy.create(groupName) : mode === "join" ? copy.join(invite?.name ?? null) : copy.continueSolo;

  return (
    <div className="grid animate-rise gap-5.5">
      <div className="grid gap-1.5 text-center">
        <h1 className="m-0 text-heading text-balance">{copy.title}</h1>
        <p className="m-0 text-text-2">{copy.subtitle}</p>
      </div>

      <div role="radiogroup" aria-label={copy.modesLabel} className="grid grid-cols-3 gap-2">
        {CREW_MODES.map((option) => {
          const meta = crewModes[option];
          const on = mode === option;
          return (
            <ChoiceButton key={option} selected={on} onClick={() => onModeChange(option)} className="gap-2.5 px-2 pt-4 pb-3.5">
              <MomentTile icon={meta.moment} tint={meta.tint} size="sm" className="size-10" />
              <span className={cn("text-center text-small", on ? "font-semibold" : "font-medium")}>{meta.label}</span>
            </ChoiceButton>
          );
        })}
      </div>

      {mode === "create" && (
        <div className="grid animate-rise gap-4.5">
          <div data-tint={group.tint} className="flex items-center gap-3.5 rounded-card bg-tint-bg p-4 text-tint">
            <GroupArtTile name={groupName || copy.newGroup} art={group.art ?? groupArtFor(groupName)} tint={group.tint} size="md" className="bg-bg" />
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-semibold">{groupName || copy.newGroup}</span>
              <span className="text-footnote">{copy.justYou}</span>
            </span>
            <Avatar name={profile.displayName} tint={profile.tint} buddy={profile.buddy} size="md" className="ring-2 ring-tint-bg" />
          </div>
          <GroupFormFields value={group} onChange={onGroupChange} errors={groupErrors} showCurrency={false} />
          <div className="flex flex-wrap gap-1.5">
            {copy.ideas.map((idea) => (
              <button
                key={idea}
                type="button"
                data-tint={group.tint}
                onClick={() => onGroupChange({ ...group, name: idea })}
                className={cn(
                  "h-7.5 cursor-pointer rounded-sm px-2.5 text-footnote font-medium transition-transform duration-200 ease-spring hover:-translate-y-0.5",
                  groupName === idea ? "bg-tint text-bg" : "bg-tint-bg text-tint",
                )}
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "join" && <JoinByLink invite={invite} onInvite={onInvite} />}

      {mode === "solo" && (
        <div data-tint="amber" className="flex animate-rise items-center gap-3.5 rounded-card bg-tint-bg p-4 text-tint">
          <Avatar name={profile.displayName} tint={profile.tint} buddy={profile.buddy} size="xl" className="size-11" />
          <span className="text-small font-medium">{copy.solo}</span>
        </div>
      )}

      {error && <InlineAlert>{error}</InlineAlert>}

      <Button size="lg" fullWidth loading={pending} disabled={mode === "join" && !invite} onClick={onSubmit} className="gap-2">
        {label}
        <Icon name="arrow-right" size={16} strokeWidth={2.2} />
      </Button>
      <button type="button" onClick={onBack} className="-mt-2 cursor-pointer justify-self-center bg-transparent p-0 text-footnote text-muted hover:text-text">
        {copy.back}
      </button>
    </div>
  );
}

function JoinByLink({ invite, onInvite }: { invite: GroupInvite | null; onInvite: (invite: GroupInvite | null) => void }) {
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const copy = welcomeCopy.crew.link;
  const slug = inviteSlugFrom(link);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      onInvite(null);
      return;
    }
    previewInvite({ slug }).then((result) => {
      if (cancelled) return;
      onInvite(result.ok ? result.data : null);
      setError(result.ok ? null : result.error.message);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, onInvite]);

  const paste = async () => {
    try {
      setLink(await navigator.clipboard.readText());
    } catch {
      setError(copy.invalid);
    }
  };

  const feedback = error ?? (link.trim() && !slug ? copy.invalid : null);

  return (
    <div className="grid animate-rise gap-3.5">
      <TextField
        label={copy.label}
        name="invite"
        placeholder={copy.placeholder}
        value={link}
        onChange={(e) => {
          setLink(e.target.value);
          setError(null);
        }}
        feedback={feedback ? { tone: "error", message: feedback } : undefined}
      />
      <button
        type="button"
        onClick={paste}
        className="-mt-1.5 cursor-pointer justify-self-start bg-transparent p-0 text-footnote font-semibold text-brand"
      >
        {copy.paste}
      </button>
      {invite && <JoinCard invite={invite} />}
    </div>
  );
}
