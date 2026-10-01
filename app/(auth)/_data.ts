import { authRules, otpExpiresInMinutes, routes } from "@/lib/auth/rules";

export interface AuthBackLink {
  readonly href: string;
  readonly label: string;
}

export const authCopy = {
  back: {
    home: { href: routes.home, label: "Back" },
    signIn: { href: routes.signIn, label: "Sign in" },
  },
  divider: "or",
  google: {
    label: "Continue with Google",
    failedTitle: "Google didn’t open.",
    failedBody: "Try again, or use your email below.",
    retry: "Try again",
  },
  email: { label: "Email", placeholder: "you@example.com" },
  password: {
    label: "Password",
    show: "Show password",
    hide: "Hide password",
  },
  verify: {
    title: "Check your email",
    subtitle: (email: string) => `We sent a ${authRules.otp.length}-digit code to ${email}.`,
  },
  code: {
    label: "Verification code",
    checking: "Checking code…",
    resend: "Resend code",
    resendIn: (seconds: number) => `Resend in ${seconds}s`,
    didntGetIt: "Didn’t get it?",
    noCode: "No code?",
    back: "Wrong email? Go back",
    resent: "New code sent",
    expiry: `It expires in ${otpExpiresInMinutes} minutes. Check your spam folder too.`,
  },
} as const satisfies { back: Record<string, AuthBackLink> } & Record<string, unknown>;
