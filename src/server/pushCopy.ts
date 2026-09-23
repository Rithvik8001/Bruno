export const pushCopy = {
  renewal: { title: "{name} renews {when}", body: "{amount} on {date}." },
  trial: {
    title: "{name} trial ends {when}",
    body: "Then {amount} {per}. Cancel before {date} to avoid it.",
  },
  renews_today: { title: "{name} renews today", body: "{amount} today." },
  batch: {
    title: "{count} subscriptions coming up",
    renewal: "{name} renews {when}, {amount}",
    trial: "{name} trial ends {when}",
    renews_today: "{name} renews today, {amount}",
    more: "and {count} more",
  },
  digest: { title: "{month} at a glance" },
  urls: { overview: "/overview", subscription: "/subscription?id={id}" },
  threads: { reminders: "reminders", digest: "digest" },
} as const;
