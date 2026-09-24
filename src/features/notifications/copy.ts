export const notificationsCopy = {
  registering: "Setting up this iPhone for notifications…",
  unregistered: (reason: string | null) =>
    `This iPhone couldn't be set up for notifications${reason === null ? "" : ` (${reason})`}. Bruno tries again each time you open the app.`,
  denied: {
    title: "Notifications are off",
    message:
      "Turn them on for Bruno in Settings to get reminders on this iPhone.",
    cancel: "Not now",
    open: "Open Settings",
  },
} as const;
