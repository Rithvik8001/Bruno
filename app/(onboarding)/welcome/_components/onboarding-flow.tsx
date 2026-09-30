"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LiveMark } from "@/components/brand/live-logo";
import { pressMotion } from "@/components/motion/press";
import { StepSwap } from "@/components/motion/rise";
import { routes } from "@/lib/auth/rules";
import type { BuddyShape } from "@/lib/design-system/buddies";
import { createGroup, joinGroup } from "@/lib/groups/actions";
import type { GroupInvite } from "@/lib/groups/queries";
import { completeOnboarding, saveProfile } from "@/lib/people/actions";
import type { PersonView } from "@/lib/people/person";
import { emptyGroupForm, type GroupFormValue } from "../../../(app)/groups/_data";
import type { GroupFormErrors } from "../../../(app)/groups/_components/group-form-fields";
import { toGroupErrors } from "../../../(app)/groups/_lib/form";
import { welcomeCopy, type CrewMode } from "../_data";
import { CrewStep } from "./crew-step";
import { DoneStep } from "./done-step";
import { ProfileStep, type ProfileValue } from "./profile-step";
import { ProgressTrack } from "./progress-track";

type FlowState =
  | { readonly step: "profile" }
  | { readonly step: "crew" }
  | { readonly step: "done"; readonly href: string; readonly line: string; readonly friends: readonly PersonView[] };

const POSITION = { profile: 0, crew: 1, done: 2 } as const;

export interface OnboardingFlowProps {
  person: PersonView;
  defaultBuddy: BuddyShape;
}

export function OnboardingFlow({ person, defaultBuddy }: OnboardingFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<FlowState>({ step: "profile" });
  const [profile, setProfile] = useState<ProfileValue>({
    displayName: person.displayName,
    buddy: person.buddy ?? defaultBuddy,
    tint: person.tint,
  });
  const [mode, setMode] = useState<CrewMode>("create");
  const [group, setGroup] = useState<GroupFormValue>({ ...emptyGroupForm, tint: "indigo" });
  const [groupErrors, setGroupErrors] = useState<GroupFormErrors>({});
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const go = (next: FlowState) => {
    setState(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveAndContinue = () =>
    startTransition(async () => {
      setError(null);
      const result = await saveProfile(profile);
      if (!result.ok) {
        setError(result.error.fields?.displayName ?? result.error.message);
        return;
      }
      go({ step: "crew" });
    });

  const finishCrew = () =>
    startTransition(async () => {
      setError(null);
      let done: Omit<Extract<FlowState, { step: "done" }>, "step">;
      if (mode === "create") {
        const result = await createGroup(group);
        if (!result.ok) {
          setGroupErrors(toGroupErrors(result.error.fields));
          if (!result.error.fields) setError(result.error.message);
          return;
        }
        done = { href: routes.group(result.data.id), line: welcomeCopy.done.created(group.name.trim()), friends: [] };
      } else if (mode === "join") {
        if (!invite) return;
        const result = await joinGroup({ slug: invite.slug });
        if (!result.ok) {
          setError(result.error.message);
          return;
        }
        done = { href: routes.group(result.data.id), line: welcomeCopy.done.joined(invite.name), friends: invite.members };
      } else {
        done = { href: routes.app, line: welcomeCopy.done.solo, friends: [] };
      }
      const completed = await completeOnboarding({});
      if (!completed.ok) {
        setError(completed.error.message);
        return;
      }
      go({ step: "done", ...done });
    });

  const skip = () =>
    startTransition(async () => {
      const result = await completeOnboarding({});
      if (result.ok) router.replace(routes.app);
    });

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] pb-safe">
      <header className="flex items-center justify-between gap-4 px-5 py-4">
        <span className="flex w-22 text-text">
          <LiveMark size={28} />
        </span>
        <ProgressTrack position={POSITION[state.step]} name={profile.displayName} tint={profile.tint} buddy={profile.buddy} />
        <span className="flex w-22 justify-end">
          {state.step !== "done" && (
            <motion.button
              type="button"
              onClick={skip}
              disabled={pending}
              {...(pending ? {} : pressMotion())}
              className="h-8 cursor-pointer rounded-sm bg-transparent px-2.5 text-small font-medium text-text-2 transition-colors hover:bg-surface hover:text-text"
            >
              {welcomeCopy.skip}
            </motion.button>
          )}
        </span>
      </header>
      <main className="flex justify-center px-5 pt-5 pb-14">
        <StepSwap stepKey={state.step} className="w-full max-w-110">
          {state.step === "profile" && (
            <ProfileStep value={profile} onChange={setProfile} onNext={saveAndContinue} pending={pending} error={error ?? undefined} />
          )}
          {state.step === "crew" && (
            <CrewStep
              profile={profile}
              mode={mode}
              onModeChange={(next) => {
                setMode(next);
                setError(null);
              }}
              group={group}
              onGroupChange={(next) => {
                setGroup(next);
                setGroupErrors({});
              }}
              groupErrors={groupErrors}
              invite={invite}
              onInvite={setInvite}
              onSubmit={finishCrew}
              onBack={() => go({ step: "profile" })}
              pending={pending}
              error={error}
            />
          )}
          {state.step === "done" && (
            <DoneStep profile={profile} friends={state.friends} line={state.line} href={state.href} />
          )}
        </StepSwap>
      </main>
    </div>
  );
}
