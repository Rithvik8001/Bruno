import "server-only";
import type { BillGroupRef } from "@/lib/bills/queries";
import type { CurrencyCode } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import { balancesWith, inScope } from "@/lib/ledger/balances";
import { loadGroupLedgers } from "@/lib/ledger/load";
import type { Cents } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";
import { loadAskAccount } from "./account";
import { isAskConfigured } from "./config";
import { getAskQuota } from "./quota";
import type { AskQuota } from "./result";

const SEED_PEOPLE = 2;

export interface AskSeedPerson {
  readonly person: PersonView;
  readonly net: Cents;
  readonly currency: CurrencyCode;
  readonly group: BillGroupRef;
}

export interface AskSeeds {
  readonly people: readonly AskSeedPerson[];
  readonly group: BillGroupRef | null;
  readonly bill: { readonly title: string; readonly group: BillGroupRef } | null;
  readonly payer: PersonView | null;
}

export interface AskScopeGroup extends BillGroupRef {
  readonly currency: CurrencyCode;
}

export interface AskStartView {
  readonly configured: boolean;
  readonly quota: AskQuota;
  readonly groups: readonly AskScopeGroup[];
  readonly scope: AskScopeGroup | null;
  readonly seeds: AskSeeds;
}

export async function getAskStart(you: PersonId, groupId: string | null, timeZone: string): Promise<AskStartView | null> {
  const [account, quota] = await Promise.all([loadAskAccount(you, groupId), getAskQuota(you, timeZone)]);
  if (!account) return null;
  const pool = account.scope ? [account.scope] : account.groups;
  const ledger = await loadGroupLedgers(pool.map((group) => group.id));
  const now = new Date();
  const byId = new Map(account.people.map((person) => [person.id, person]));

  const people = pool
    .flatMap((group) => {
      const balances = balancesWith(you, inScope(ledger.debts, group.id), inScope(ledger.settlements, group.id), now).get(group.currency);
      return [...(balances ?? [])].flatMap(([id, net]): AskSeedPerson[] => {
        const person = byId.get(id);
        return person && net !== 0 ? [{ person, net, currency: group.currency, group: group.ref }] : [];
      });
    })
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    .filter((seed, index, all) => all.findIndex((other) => other.person.id === seed.person.id) === index)
    .slice(0, SEED_PEOPLE);
  const fallback = account.people.find((person) => person.id !== you);
  const busiest = [...pool].sort((a, b) => inScope(ledger.bills, b.id).length - inScope(ledger.bills, a.id).length)[0];
  const latest = ledger.bills[0];
  const latestGroup = latest ? pool.find((group) => group.id === latest.groupId) : undefined;
  const paid = ledger.bills.find((bill) => bill.payerId !== you && byId.has(bill.payerId));
  const toScope = (group: (typeof pool)[number]): AskScopeGroup => ({ ...group.ref, currency: group.currency });

  return {
    configured: isAskConfigured(),
    quota,
    groups: account.groups.map(toScope),
    scope: account.scope ? toScope(account.scope) : null,
    seeds: {
      people:
        people.length > 0 || !fallback || !busiest ? people : [{ person: fallback, net: 0 as Cents, currency: busiest.currency, group: busiest.ref }],
      group: busiest && inScope(ledger.bills, busiest.id).length > 0 ? busiest.ref : null,
      bill: latest && latestGroup ? { title: latest.title, group: latestGroup.ref } : null,
      payer: paid ? (byId.get(paid.payerId) ?? null) : null,
    },
  };
}

export interface AskBarView {
  readonly configured: boolean;
  readonly quota: AskQuota;
}

export async function getAskBar(you: PersonId, timeZone: string): Promise<AskBarView> {
  return { configured: isAskConfigured(), quota: await getAskQuota(you, timeZone) };
}
