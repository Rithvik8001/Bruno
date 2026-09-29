export interface RateWindow {
  readonly seconds: number;
  readonly max: number;
}

export type RateScope = "person" | "ip";

export interface RateRule {
  readonly person?: readonly RateWindow[];
  readonly ip?: readonly RateWindow[];
}

const MINUTE = 60;
const HOUR = 3600;

export const rateRules = {
  lookup: {
    person: [
      { seconds: MINUTE, max: 6 },
      { seconds: HOUR, max: 30 },
    ],
    ip: [
      { seconds: MINUTE, max: 20 },
      { seconds: HOUR, max: 120 },
    ],
  },
  addGuest: { person: [{ seconds: HOUR, max: 20 }] },
  guestInvite: { person: [{ seconds: HOUR, max: 10 }] },
  claim: { ip: [{ seconds: MINUTE, max: 10 }] },
} as const satisfies Record<string, RateRule>;

export type RateRuleName = keyof typeof rateRules;
