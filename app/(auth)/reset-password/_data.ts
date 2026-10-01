import type { IconName } from "@/components/icons/icon";
import { authRules } from "@/lib/auth/rules";
import type { PaletteTint } from "@/lib/design-system/tokens";

export const RESET_STAGES = ["email", "code", "password"] as const;
export type ResetStage = (typeof RESET_STAGES)[number];

export interface ResetStageAppearance {
  readonly icon: IconName;
  readonly tint: PaletteTint;
}

export const resetStageAppearance = {
  email: { icon: "mail", tint: "blue" },
  code: { icon: "keypad", tint: "pink" },
  password: { icon: "lock", tint: "violet" },
} as const satisfies Record<ResetStage, ResetStageAppearance>;

export const resetCopy = {
  metaTitle: "Reset your password",
  headers: {
    email: {
      title: "Forgot your password?",
      subtitle: `Happens to the best of us. We’ll email you a ${authRules.otp.length}-digit code.`,
    },
    code: { title: "Enter your code", subtitle: "We sent it to the address below." },
    password: { title: "Choose a new password", subtitle: "Make it one you don’t use anywhere else." },
    done: { title: "You’re all set", subtitle: "Password updated. You’re signed in." },
    doneSignedOut: { title: "You’re all set", subtitle: "Password updated. Sign in with your new password." },
  },
  journey: {
    step: (current: number, total: number) => `Step ${current} of ${total}`,
    finished: "All steps done",
  },
  email: {
    required: "Enter your email.",
    submit: "Send code",
    remembered: "Remembered it?",
    backToSignIn: "Back to sign in",
  },
  code: {
    change: "Change",
  },
  password: {
    label: "New password",
    placeholder: `At least ${authRules.password.min} characters`,
    confirmLabel: "Confirm password",
    confirmPlaceholder: "Type it once more",
    mismatch: "Passwords don’t match yet.",
    match: "They match",
    signOutOthers: "Sign out of other devices",
    submit: "Save new password",
  },
  rules: {
    length: `${authRules.password.min}+ characters`,
    numberOrSymbol: "A number or symbol",
    notEmail: "Not your email",
  },
  done: {
    signedOut: (count: number) => `Signed out of ${count} other ${count === 1 ? "device" : "devices"}.`,
    continue: "Go to Bruno",
    signIn: "Sign in",
  },
} as const;
