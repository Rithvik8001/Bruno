import { authRules } from "@/lib/auth/rules";

export const signUpCopy = {
  metaTitle: "Create your account",
  form: {
    title: "Create your account",
    subtitle: "Free for 3 AI extractions a day. No card needed.",
  },
  done: {
    title: (firstName: string) => `You're in, ${firstName}.`,
    subtitle: "Add your first bill whenever you're ready.",
    cta: "Go to Bruno",
  },
  fields: {
    name: { label: "Name", placeholder: "What your friends call you" },
    username: { label: "Username", placeholder: "sam_okafor" },
    password: {
      placeholder: `At least ${authRules.password.min} characters`,
      hint: `Use ${authRules.password.min}+ characters. A number or symbol makes it stronger.`,
    },
  },
  username: {
    checking: "Checking…",
    available: (username: string) => `@${username} is available`,
    taken: "That username is taken. Try another.",
  },
  submit: "Create account",
  legal: { prefix: "By continuing you agree to the", terms: "terms", and: "and", privacy: "privacy policy" },
  switchPrompt: "Already have an account?",
  switchCta: "Sign in",
  footer: "Friends don't need an account to claim their items.",
} as const;
