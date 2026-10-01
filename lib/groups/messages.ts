export const groupMessages = {
  notMember: "You’re not in this group. Ask a member for the invite link.",
  notAdmin: "Only group admins can do that.",
  currencyLocked: "Currency is locked once the group has bills.",
  notSquare: "Settle up first. Everyone needs to be square.",
  memberNotSquare: "They still owe or are owed money in this group. Settle up first, then remove them.",
  lastAdmin: "Make someone else an admin first.",
  onlyMember: "You’re the only one here. Delete the group instead.",
  deadLink: "This invite link doesn’t work any more. Ask for a new one.",
  slugTaken: "Unable to create a link. Try again.",
  cantRemoveGuest: "Only an admin or whoever added them can remove a guest.",
  guestAdmin: "Guests can’t be admins until they join Bruno.",
} as const;
