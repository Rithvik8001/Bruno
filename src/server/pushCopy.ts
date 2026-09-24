export const pushCopy = {
  renewal: {
    title: "{name} wants {amount} {when}",
    body: "{date}. Still using it? Cancel before then.",
  },
  trial: {
    title: "Your {name} free trial ends {when}",
    body: "Then {amount} {per}. Cancel before {date} if you're done.",
  },
  renews_today: {
    title: "{name} is collecting {amount} today",
    body: "Hopefully it's earning its keep.",
  },
  batch: {
    title: "{count} subscriptions are about to knock",
    renewal: "{name} renews {when}, {amount}",
    trial: "{name} trial ends {when}",
    renews_today: "{name} renews today, {amount}",
    more: "and {count} more",
  },
  digest: {
    title: "{month}: {total} heading out",
    titleNone: "{month}: a quiet month",
  },
  urls: { overview: "/overview", subscription: "/subscription?id={id}" },
  threads: { reminders: "reminders", digest: "digest" },
} as const;
