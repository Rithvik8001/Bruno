import type { Icon3dId } from "@/lib/design-system/icons3d";
import type { Plan } from "@/lib/generated/prisma/enums";
import type { NotificationCategory } from "@/lib/notifications/kinds";
import { notificationCategoryCopy, type NotificationCategoryCopy } from "@/lib/notifications/messages";
import type { ThemePreference } from "@/lib/theme/theme";

export interface SectionCopy {
  readonly title: string;
  readonly icon: Icon3dId | null;
}

export const NOTIFICATIONS_ANCHOR = "notifications";

export const settingsCopy = {
  metaTitle: "Settings",
  title: "Settings",
  sections: {
    profile: { title: "Profile", icon: null },
    plan: { title: "Plan", icon: "gem" },
    notifications: { title: "Email notifications", icon: "bell" },
    preferences: { title: "Preferences", icon: "sparkles" },
    account: { title: "Account", icon: "key" },
  },
  profile: {
    buddy: "Buddy",
    colour: "Colour",
    name: "Name",
    email: "Email",
    verified: "Verified",
    save: "Save changes",
    saved: "Saved",
    failed: "Unable to save your profile. Check your connection and try again.",
  },
  plan: {
    names: { FREE: "Free", PRO: "Pro" },
    tags: { FREE: "Forever", PRO: "Active" },
    sub: {
      FREE: (proLimit: number) => `Everything included. Pro is coming soon, with ${proLimit} assists a day.`,
      PRO: () => "More assists every day.",
    },
    usage: "Assists today",
    used: (used: number, limit: number) => `${used} of ${limit}`,
    resets: "Resets at midnight. Typing a bill in is always unlimited.",
  },
  notifications: {
    failed: "Unable to save that. Check your connection and try again.",
    rows: notificationCategoryCopy,
  },
  appearance: {
    label: "Appearance",
    sub: "Follows this device unless you pick one.",
    options: { light: "Light", dark: "Dark", system: "System" },
  },
  signOut: "Sign out",
} as const satisfies {
  sections: Record<string, SectionCopy>;
  plan: { names: Record<Plan, string>; tags: Record<Plan, string>; sub: Record<Plan, (proLimit: number) => string> } & Record<string, unknown>;
  notifications: { rows: Record<NotificationCategory, NotificationCategoryCopy> } & Record<string, unknown>;
  appearance: { options: Record<ThemePreference, string> } & Record<string, unknown>;
} & Record<string, unknown>;
