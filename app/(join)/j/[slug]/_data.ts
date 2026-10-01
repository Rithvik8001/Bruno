export const joinCopy = {
  metaTitle: "Join a group",
  title: (name: string) => `Join ${name}`,
  subtitle: "Your friends are splitting bills here. Join to see balances and add your own.",
  invited: (by: string | null, count: number) =>
    `${by ? `${by} invited you · ` : ""}${count} ${count === 1 ? "person" : "people"}`,
  join: (name: string) => `Join ${name}`,
  notNow: "Not now",
  dead: {
    title: "This invite link doesn’t work any more",
    body: "Ask whoever sent it for a new one.",
    home: "Go to Bruno",
  },
} as const;
