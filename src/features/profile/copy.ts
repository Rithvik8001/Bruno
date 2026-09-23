export const profileCopy = {
  currency: {
    setupTitle: "Your currency",
    setupSubtitle:
      "Every amount in Bruno uses one currency. You can change it later in Settings.",
    setupContinue: (code: string) => `Continue with ${code}`,
    title: "Currency",
    cancel: "Cancel",
    search: "Search",
    searchPlaceholder: "Currency or code",
    suggested: "Suggested",
    all: "All currencies",
    noMatchTitle: "No currency matches",
    noMatchBody: "Try the three-letter code, like EUR.",
    switchTitle: (name: string) => `Switch to ${name}?`,
    switchMessage: (count: number, code: string) =>
      count === 0
        ? `New subscriptions will use ${code}.`
        : `${count === 1 ? "Your subscription" : `Your ${count} subscriptions`} will show in ${code} with the same ${count === 1 ? "amount" : "amounts"}. Nothing is converted, so check ${count === 1 ? "it" : "them"} against what you're charged.`,
    switchCancel: "Cancel",
    switchConfirm: "Switch",
    selected: "Selected",
  },
} as const;
