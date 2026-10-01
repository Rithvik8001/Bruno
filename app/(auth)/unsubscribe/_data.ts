export const unsubscribeCopy = {
  metaTitle: "Unsubscribe",
  ask: {
    title: "Stop these emails?",
    subtitle: (label: string) => `You won’t get “${label}” emails from Bruno any more. You can turn them back on in Settings.`,
    confirm: "Unsubscribe",
  },
  done: {
    title: "You’re unsubscribed",
    subtitle: (label: string) => `No more “${label}” emails. Everything else stays as it was.`,
    settings: "Notification settings",
  },
  expired: {
    title: "This link has expired",
    subtitle: "Sign in and change your email notifications in Settings instead.",
    settings: "Open Settings",
  },
  failed: "Unable to unsubscribe. Check your connection and try again.",
} as const;
