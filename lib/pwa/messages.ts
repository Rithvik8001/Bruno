import type { DeviceKind } from "./platform";

const deviceLabel = {
  iphone: "this iPhone",
  ipad: "this iPad",
  mac: "this Mac",
  android: "this Android",
  other: "this device",
} as const satisfies Record<DeviceKind, string>;

export const pushRowCopy = {
  label: "Push on this device",
  on: "Instant pings for bills, claims and payments.",
  off: "Email still arrives. Turn on for the quick stuff.",
  pending: "Allow it in the prompt your browser just showed.",
  blocked: {
    chip: "Blocked",
    lead: "Your browser is blocking push for Bruno. Three taps fixes it:",
    steps: ["Tap aA in the address bar", "Website settings → Notifications", "Allow, then come back here"],
    note: "Installed on iPhone: Settings → Notifications → Bruno. Chrome: lock icon → Notifications.",
  },
  needsInstall: { body: "On iPhone, push only works once Bruno is on your Home Screen.", cta: "Add to Home Screen" },
  unsupported: { body: "This browser can’t do push yet. Email carries on as usual.", chip: "Not here" },
  toastOn: (device: DeviceKind) => `Push is on for ${deviceLabel[device]}.`,
  toastOff: "Push is off here. Email carries on.",
  undo: "Undo",
  noAnswer: "No answer from the browser. Try again.",
  failed: "Unable to change push. Check your connection and try again.",
} as const;

export const installRowCopy = {
  label: "Install Bruno",
  promptPhone: "Opens from your home screen, no browser bar.",
  promptDesktop: "Opens from your dock, no browser bar.",
  ios: "Three steps in Safari. Ten seconds.",
  install: "Install",
  showMe: "Show me",
} as const;

export const installCardCopy = {
  phone: { title: "Put Bruno on your Home Screen", body: "Opens like an app. Push works too.", short: "Opens like an app.", cta: "Add" },
  desktop: { title: "Install Bruno", body: "Lives in your dock, opens in its own window.", short: "Lives in your dock.", cta: "Install" },
  dismiss: "Hide for now",
} as const;

export const installSheetCopy = {
  title: "Add Bruno to your Home Screen",
  lead: "Three taps in Safari. Then push works and there’s no browser bar.",
  leadShort: "Three taps in Safari.",
  done: "Done",
  addToHomeScreen: "Add to Home Screen",
  phone: [
    { title: "Tap Share", body: "The square with an arrow, bottom of Safari.", short: "The square with an arrow, bottom of Safari." },
    { title: "Add to Home Screen", body: "Scroll the list a little. It has a plus in a square.", short: "Scroll the list a little." },
    { title: "Open Bruno from the Home Screen", body: "From now on, open it there, not in Safari.", short: "Not in Safari any more." },
  ],
  tablet: [
    { title: "Tap Share, top right", body: "Next to the address bar.", short: "Next to the address bar." },
    { title: "Add to Home Screen", body: "In the list that opens.", short: "In the list that opens." },
    { title: "Open Bruno from the Home Screen", body: "From now on, open it there, not in Safari.", short: "Not in Safari any more." },
  ],
  shortTitle: "Open Bruno from there",
} as const;

const NAMES_MAX = 3;

function orList(names: readonly string[]): string | null {
  if (names.length === 0 || names.length > NAMES_MAX) return null;
  if (names.length === 1) return names[0] ?? null;
  return `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`;
}

export interface OptInCopy {
  readonly title: string;
  readonly body: string;
  readonly grantedBody: string;
}

export const optInCopy = {
  claim: {
    title: "Get pinged when friends claim",
    body: "A push the moment someone taps an item. Nothing else.",
    grantedBody: "You’ll hear the moment someone claims.",
  },
  split: (names: readonly string[]) => ({
    title: "Hear when they pay you back",
    body: orList(names) ? `A push when ${orList(names)} settles. Nothing else.` : "A push when they settle. Nothing else.",
    grantedBody: "You’ll hear the moment they pay you back.",
  }),
  confirm: (name: string) => ({
    title: `Know when ${name} confirms`,
    body: "One push when it’s marked received. Nothing else.",
    grantedBody: `You’ll hear the moment ${name} confirms.`,
  }),
  notNow: "Not now",
  turnOn: "Turn on",
  waiting: "Allow it in the prompt at the top.",
  granted: (device: DeviceKind) => `Push is on for ${deviceLabel[device]}.`,
  blocked: {
    title: "Push got blocked",
    body: "Your browser said no. You can change that in two taps: aA → Website settings → Notifications → Allow.",
    gotIt: "Got it",
  },
  ios: { body: "On iPhone, add Bruno to your Home Screen first. Three taps.", cta: "Show me how" },
} as const;

export const offlineCopy = {
  metaTitle: "Offline",
  title: "You’re offline.",
  body: "Bruno keeps the numbers out of sight until it can check they’re right.",
  retry: "Try again",
  backTitle: "Back online.",
  backBody: "Picking up where you were.",
} as const;
