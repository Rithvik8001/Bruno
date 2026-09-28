export const signInCopy = {
  metaTitle: "Sign in",
  form: {
    title: "Welcome back",
    subtitle: "Sign in to see who owes whom.",
  },
  fields: {
    email: { required: "Enter your email." },
    password: { placeholder: "Your password", required: "Enter your password.", forgot: "Forgot password?" },
  },
  remember: "Keep me signed in on this device",
  submit: "Sign in",
  badCredentials: {
    title: "That email and password don't match.",
    body: "Check for typos, or",
    action: "reset your password",
  },
  locked: {
    title: "Too many tries.",
    body: (seconds: number) => `Wait ${seconds}s, or`,
    action: "reset your password",
  },
  verifyBack: "Back to sign in",
  switchPrompt: "New here?",
  switchCta: "Create an account",
  footer: "Claiming from a shared link? You don't need to sign in.",
} as const;
