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
    notifications: { title: "Notifications", icon: "bell" },
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
  currency: { label: "Default currency", sub: "New groups start in this currency.", failed: "Unable to save that. Try again." },
  signOut: "Sign out",
  deleteAccount: {
    row: "Delete account",
    hint: "Only when everything’s settled",
    blocked: {
      notNow: "Not now",
      more: (n: number) => `and ${n} more`,
      money: {
        owed: (amount: string) => `You still have ${amount} owed to you.`,
        owe: (amount: string) => `You still owe ${amount}.`,
        both: (owed: string, owe: string) => `You’re owed ${owed} and you owe ${owe}.`,
        owedBody: "Settle or forgive those first. Deleting now would drop them for everyone.",
        oweBody: "Pay that back first, so nobody is left short.",
        bothBody: "Settle both first, so nobody is left short.",
        cta: "Go settle up",
      },
      payment: {
        title: "A payment is still waiting to be confirmed.",
        sent: (name: string, amount: string) => `${name} hasn’t confirmed your ${amount} yet.`,
        received: (name: string, amount: string) => `You haven’t confirmed ${amount} from ${name} yet.`,
        cta: "See payments",
      },
      claiming: {
        title: (bill: string) => `${bill} is still open for claiming.`,
        body: "Finish claiming or close the bill first, so everyone’s share is set.",
        cta: "Finish that bill",
      },
      admin: {
        title: (group: string) => `${group} needs another admin.`,
        body: "Make someone else an admin first, or the group is left without one.",
        cta: (group: string) => `Open ${group}`,
      },
    },
    confirm: {
      title: "Delete your account?",
      body: "This can’t be undone.",
      happens: "What happens",
      profile: "Your profile, sign-in and settings are deleted.",
      groups: (n: number) => (n === 0 ? "You have no groups to leave." : n === 1 ? "You leave your group." : `You leave all ${n} of your groups.`),
      bills: "Bills you were part of stay for your friends, shown as ‘Deleted member’.",
      exportAsk: "Want a copy first?",
      exportLink: "Export my data",
      field: "Type DELETE to confirm",
      submit: "Delete my account",
      working: "Deleting…",
      retry: "Try again",
      keep: "Keep my account",
      failed: { strong: "Bruno couldn’t delete your account.", rest: "Nothing was changed." },
      limited: { strong: "That’s a lot of tries.", rest: "Wait a minute and try again." },
    },
  },
} as const satisfies {
  sections: Record<string, SectionCopy>;
  plan: { names: Record<Plan, string>; tags: Record<Plan, string>; sub: Record<Plan, (proLimit: number) => string> } & Record<string, unknown>;
  notifications: { rows: Record<NotificationCategory, NotificationCategoryCopy> } & Record<string, unknown>;
  appearance: { options: Record<ThemePreference, string> } & Record<string, unknown>;
} & Record<string, unknown>;
