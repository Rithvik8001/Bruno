export type PairStanding =
  | { readonly kind: "square" }
  | { readonly kind: "youOwe"; readonly amount: string }
  | { readonly kind: "theyOwe"; readonly amount: string };

const standing = (other: string, pair: PairStanding) =>
  pair.kind === "square"
    ? `You’re square with ${other}.`
    : pair.kind === "youOwe"
      ? `You still owe ${other} ${pair.amount}.`
      : `${other} still owes you ${pair.amount}.`;

const inGroup = (group: string, line: string) => `${group} · ${line}`;

export const pushMessages = {
  billAdded: (group: string, total: string) => inGroup(group, `${total} total. Tap to see the split.`),
  billSplit: (group: string, actor: string) => inGroup(group, `${actor} shared out the leftovers. See what you had.`),
  claimInviteTitle: (sender: string, bill: string, group: string) => `${sender}’s claiming ${bill} with ${group}`,
  claimInvite: (group: string, sender: string) => inGroup(group, `Tap what you had before ${sender} finishes the bill.`),
  claimReminderTitle: (sender: string, bill: string) => `${sender}’s waiting on you: claim your ${bill} items`,
  claimReminder: (group: string, claimed: number, total: number, sender: string) =>
    inGroup(group, `${claimed} of ${total} have claimed. ${sender} closes the bill soon.`),
  claimsComplete: (group: string, total: string, people: number) => inGroup(group, `${total} across ${people}. Finish the bill to split it.`),
  itemsClaimedTitle: (name: string, count: number, bill: string) => `${name} claimed ${count === 1 ? "1 item" : `${count} items`} on ${bill}`,
  itemsClaimed: (group: string, claimed: number, total: number) => inGroup(group, `${claimed} of ${total} have claimed.`),
  paymentReceivedTitle: (from: string, amount: string) => `${from} paid you ${amount}`,
  paymentReceived: (group: string) => inGroup(group, "Confirm you got it and Bruno clears it."),
  paymentConfirmedTitle: (other: string, amount: string) => `${other} confirmed your ${amount}`,
  paymentReceivedByThemTitle: (other: string, amount: string) => `${other} marked your payment as received · ${amount}`,
  paymentCancelledTitle: (other: string, amount: string) => `${other} cancelled a ${amount} payment`,
  paymentStanding: (group: string, other: string, pair: PairStanding) => inGroup(group, standing(other, pair)),
  debtReminder: (group: string) => inGroup(group, "Settle in Bruno, or mark it paid if you already have."),
  addedToGroup: (group: string, people: number) => inGroup(group, `${people} people. Bills here now include you.`),
  claimNow: "Claim now",
} as const;

export const pushTags = {
  bill: (billId: string) => `bill:${billId}`,
  settlement: (settlementId: string) => `settlement:${settlementId}`,
  debt: (groupId: string, creditorId: string) => `debt:${groupId}:${creditorId}`,
  group: (groupId: string) => `group:${groupId}`,
} as const;
