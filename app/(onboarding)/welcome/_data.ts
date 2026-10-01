import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";

export const ONBOARDING_STEPS = ["profile", "crew", "done"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const CREW_MODES = ["create", "join", "solo"] as const;
export type CrewMode = (typeof CREW_MODES)[number];

export interface CrewModeOption {
  readonly label: string;
  readonly moment: MomentIconId;
  readonly tint: PaletteTint;
}

export const crewModes = {
  create: { label: "Start a group", moment: "party", tint: "indigo" },
  join: { label: "I have a link", moment: "link", tint: "cyan" },
  solo: { label: "Just me", moment: "sparkles", tint: "amber" },
} as const satisfies Record<CrewMode, CrewModeOption>;

export const welcomeCopy = {
  metaTitle: "Welcome",
  you: "You",
  skip: "Skip",
  progress: (step: number, total: number) => (step > total ? "All done" : `Step ${step} of ${total}`),
  profile: {
    title: (first: string) => `Hey ${first}, make it yours`,
    subtitle: "This is how friends spot you on every receipt.",
    avatar: "Your avatar",
    name: { label: "What do friends call you?", placeholder: "Your name" },
    buddy: "Pick your buddy",
    colour: "Pick your colour",
    next: "Looks like me",
  },
  crew: {
    title: "Who do you split with?",
    subtitle: "Groups keep running balances, so nobody keeps score.",
    modesLabel: "How you’ll use Bruno",
    newGroup: "Your new group",
    justYou: "Just you so far",
    ideas: ["Flatmates", "Lisbon trip", "Friday dinners", "Office lunch"],
    link: { label: "Invite link", placeholder: "bruno.vin/j/…", paste: "Paste from clipboard", invalid: "Paste a Bruno invite link, like bruno.vin/j/lisbon." },
    solo: "Flying solo is fine. Share any bill with a link whenever someone joins you.",
    create: (name: string) => (name ? `Create “${name}”` : "Create group"),
    join: (name: string | null) => (name ? `Join ${name}` : "Paste a link to continue"),
    continueSolo: "Continue solo",
    back: "Back",
  },
  done: {
    title: (first: string) => `You’re in, ${first}`,
    created: (group: string) => `${group} is ready. Share the invite link whenever you like.`,
    joined: (group: string) => `You joined ${group}. They’ll see you pop in.`,
    solo: "Add your first bill whenever you’re ready.",
    cta: "Let’s split something",
  },
} as const;
