export const GROUP_TABS = ["bills", "balances", "members"] as const;
export type GroupTab = (typeof GROUP_TABS)[number];

export const groupDetailCopy = {
  metaTitle: "Group",
  youName: "You",
  back: "Groups",
  tabs: { bills: "Bills", balances: "Balances", members: "Members" },
  tabsLabel: "Group sections",
  inviteLink: "Invite link",
  copyLink: "Copy link",
  copied: "Copied",
  addBill: "Add a bill",
  settings: "Group settings",
  membersLine: (names: readonly string[], currency: string) => `${joinNames(names)} · ${currency}`,
  summary: {
    spent: "Group spent",
    share: "Your share",
    owed: "You're owed",
    owe: "You owe",
    square: "All square",
  },
  bills: { title: "No bills yet.", body: "Add the first one and Bruno will keep the running tab." },
  balances: { title: "Everyone's square.", body: "Balances show up here once there are bills." },
  members: {
    you: "(you)",
    admin: "Admin",
    member: "Member",
    joined: (date: string) => `joined ${date}`,
    more: (name: string) => `Options for ${name}`,
    note: "Anyone with the link can join. They only need an account to see balances.",
  },
  memberSheet: {
    makeAdmin: "Make admin",
    makeMember: "Remove admin",
    remove: "Remove from group",
    leave: "Leave group",
    confirmRemove: (name: string) => `Remove ${name}?`,
    confirmRemoveBody: "They'll lose access to this group. You can invite them again any time.",
    confirmLeave: "Leave this group?",
    confirmLeaveBody: "You'll need a new invite link to come back.",
    confirm: "Yes, do it",
    cancel: "Cancel",
  },
  settingsSheet: {
    title: "Group settings",
    description: "Change how the group looks. Everyone sees the same thing.",
    save: "Save changes",
    saved: "Group updated",
    reset: "Reset invite link",
    resetBody: "The current link stops working right away.",
    resetDone: "New invite link ready",
    delete: "Delete group",
    deleteBody: "This hides the group for everyone. Bills and history are kept.",
    deleteBlocked: "Everyone needs to be square before the group can be deleted.",
    confirm: "Yes, do it",
    cancel: "Cancel",
  },
} as const;

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
