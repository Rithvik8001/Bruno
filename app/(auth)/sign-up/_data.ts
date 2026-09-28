import { authRules } from "@/lib/auth/rules";

export const signUpCopy = {
  metaTitle: "Create your account",
  form: {
    title: "Create your account",
    subtitle: "Free for 3 AI extractions a day. No card needed.",
  },
  verify: {
    title: "Check your email",
    subtitle: (email: string) => `We sent a ${authRules.otp.length}-digit code to ${email}.`,
  },
  done: {
    title: (firstName: string) => `You're in, ${firstName}.`,
    subtitle: "Add your first bill whenever you're ready.",
    cta: "Go to Bruno",
  },
  fields: {
    name: { label: "Name", placeholder: "What your friends call you" },
    username: { label: "Username", placeholder: "sam_okafor" },
    email: { label: "Email", placeholder: "you@example.com" },
    password: {
      label: "Password",
      placeholder: `At least ${authRules.password.min} characters`,
      hint: `Use ${authRules.password.min}+ characters. A number or symbol makes it stronger.`,
      show: "Show password",
      hide: "Hide password",
    },
  },
  username: {
    checking: "Checking…",
    available: (username: string) => `@${username} is available`,
    taken: "That username is taken. Try another.",
  },
  google: {
    label: "Continue with Google",
    failedTitle: "Google didn't open.",
    failedBody: "Try again, or sign up with email below.",
    retry: "Try again",
  },
  divider: "or",
  submit: "Create account",
  legal: { prefix: "By continuing you agree to the", terms: "terms", and: "and", privacy: "privacy policy" },
  switchPrompt: "Already have an account?",
  switchCta: "Sign in",
  code: {
    checking: "Checking…",
    resend: "Resend code",
    resendIn: (seconds: number) => `Resend in ${seconds}s`,
    didntGetIt: "Didn't get it?",
    back: "Wrong email? Go back",
    resent: "New code sent",
  },
} as const;
