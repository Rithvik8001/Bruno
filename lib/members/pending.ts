import { personId, type PersonId } from "@/lib/domain/ids";

const PREFIX = "new-guest:";

export const PENDING_GUEST_KEY = /^[a-z0-9]{1,8}$/;

export interface PendingGuest {
  readonly key: string;
  readonly name: string;
}

export function pendingGuestId(key: string): PersonId {
  return personId(`${PREFIX}${key}`);
}

export function isPendingGuestId(id: string): boolean {
  return id.startsWith(PREFIX);
}

interface GuestRefs {
  readonly payerId: string;
  readonly items: readonly { readonly claimedBy: readonly string[] }[];
  readonly participants: readonly { readonly personId: string }[];
}

export function usedGuests<G extends PendingGuest>(values: GuestRefs, guests: readonly G[]): G[] {
  const referenced = new Set([
    values.payerId,
    ...values.items.flatMap((item) => item.claimedBy),
    ...values.participants.map((p) => p.personId),
  ]);
  return guests.filter((guest) => referenced.has(pendingGuestId(guest.key)));
}

export function resolveGuests<
  V extends {
    readonly payerId: string;
    readonly items: readonly { readonly claimedBy: string[] }[];
    readonly participants: readonly { readonly personId: string }[];
  },
>(values: V, created: ReadonlyMap<string, string>): V {
  if (created.size === 0) return values;
  const swap = (id: string) => created.get(id) ?? id;
  return {
    ...values,
    payerId: swap(values.payerId),
    items: values.items.map((item) => ({ ...item, claimedBy: item.claimedBy.map(swap) })),
    participants: values.participants.map((p) => ({ ...p, personId: swap(p.personId) })),
  };
}
