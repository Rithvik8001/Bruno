export const pushMessages = {
  billAdded: (groupName: string, total: string) => `${groupName} · ${total} total`,
  claimInvite: (groupName: string) => `${groupName} · Tap what you had.`,
  claimReminder: (groupName: string) => `${groupName} · Claim your items so the bill can close.`,
  claimsComplete: (groupName: string) => `${groupName} · Finish the bill to split it.`,
  paymentReceived: (groupName: string, pending: boolean) => (pending ? `${groupName} · Confirm you got it.` : groupName),
  paymentUpdate: (groupName: string) => groupName,
  debtReminder: (groupName: string) => `${groupName} · Settle up in Bruno.`,
  addedToGroup: (groupName: string) => `${groupName} · Bills here now include you.`,
} as const;

export const pushTags = {
  bill: (billId: string) => `bill:${billId}`,
  claim: (billId: string) => `claim:${billId}`,
  settlement: (settlementId: string) => `settlement:${settlementId}`,
  debt: (groupId: string, creditorId: string) => `debt:${groupId}:${creditorId}`,
  group: (groupId: string) => `group:${groupId}`,
} as const;
