import { allowanceCopy, assistNames } from "@/lib/ai/messages";
import { TELL_TEXT_MAX } from "@/lib/tell/rules";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function listNames(names: readonly string[], max: number): string {
  const shown = names.slice(0, max);
  const more = names.length - shown.length;
  const all = more > 0 ? [...shown, `${more} more`] : shown;
  if (all.length <= 1) return all.join("");
  return `${all.slice(0, -1).join(", ")} and ${all[all.length - 1]}`;
}

export const tellCopy = {
  metaTitle: assistNames.say,
  back: "Add a bill",
  backToCompose: "Back",
  compose: {
    title: assistNames.say,
    body: "Say it like you’d text a friend. Bruno turns it into a bill you can check.",
    fieldLabel: "Describe the bill",
    placeholder: (name: string | null) => `Dinner at Nobu 4,200, I paid, ${name ?? "Sam"} had both cocktails, split the rest`,
    knows: (names: readonly string[], symbol: string) => `Bruno knows ${listNames(names, 5)}. Prices in ${symbol}.`,
    knowsSolo: (group: string, symbol: string) => `It’s just you in ${group} so far. Prices in ${symbol}.`,
    hint: { mic: "Type or tap the mic", type: "Type what happened", listening: "Listening. Tap stop when you’re done.", denied: "Mic is off" },
    count: (length: number) => `${length} / ${TELL_TEXT_MAX}`,
    dictate: "Dictate",
    micBlocked: "Microphone blocked",
    stop: "Stop",
    stopLabel: "Stop listening",
    listeningEmpty: "Go ahead, Bruno’s listening…",
    denied: { title: "Bruno can’t hear you yet.", body: "Allow the microphone in your browser settings, or just type it.", retry: "Try again" },
    over: { title: "That’s too long", body: `Keep it to ${TELL_TEXT_MAX} characters, just the bill bits.` },
    cta: "Draft it",
    wait: (seconds: number) => `Try again in ${seconds}s`,
    ctaNote: `${allowanceCopy.cost}. Free if Bruno can’t work it out.`,
    examplesLabel: "Not sure how to say it? Tap one.",
    examples: (first: string | null, second: string | null): readonly string[] => [
      first ? `Taxi 380, ${first} paid, split it` : "Taxi 380, I paid, split it",
      second ?? first ? `Groceries 1,250, I paid, ${second ?? first} owes half` : "Groceries 1,250, I paid, split it",
      first ? `Dinner at Nobu 4,200, I paid, ${first} had both cocktails, split the rest` : "Dinner at Nobu 4,200, I paid, split it",
    ],
  },
  failed: {
    vague: {
      title: "Bruno couldn’t find a bill in that",
      body: (example: string) =>
        `Say what it was, how much, and who paid, like “${example}”. ${allowanceCopy.notCounted}`,
    },
    network: {
      title: "Bruno lost the connection",
      body: `Your words are still here. Try again in a moment. ${allowanceCopy.notCounted}`,
    },
    again: "Try again",
    againIn: (seconds: number) => `Try again in ${seconds}s`,
    type: assistNames.manual,
  },
  working: {
    title: "Drafting it",
    body: "Usually takes a few seconds.",
    said: "You said",
    total: "Total",
    cancel: "Cancel",
    chip: { drafting: "Drafting", ready: "Ready" },
    captions: {
      reading: ["Reading what you said…", "Picking out places, people and prices."],
      paying: ["Finding who paid…", "And who had what."],
      matching: (group: string) => [`Matching names to ${group}…`, "Checking who Bruno knows."] as const,
      splitting: ["Splitting it up…", "Every number comes from what you said."],
      found: (title: string, total: string | null) => [total ? `Found ${title} · ${total}` : `Found ${title}`, "Lining up the items."] as const,
      ready: (items: number, total: string | null) => ["Got it.", total ? `${plural(items, "item", "items")} · ${total}` : plural(items, "item", "items")] as const,
    },
  },
  clarify: {
    title: (count: number) => (count === 1 ? "One quick check" : count === 2 ? "Two quick checks" : "Three quick checks"),
    body: (count: number) => (count === 1 ? "Bruno got most of it. Just this:" : "Tap to answer. Anything you skip, you can fix in review."),
    whichHad: (name: string, item: string) => `Which ${name} had the ${item}?`,
    whichPaid: (name: string) => `Which ${name} paid?`,
    which: (name: string) => `Which ${name}?`,
    whichSub: (count: number, group: string) => `There are ${count === 2 ? "two" : count} in ${group}.`,
    who: (name: string) => `Who’s ${name}?`,
    whoSub: (name: string, group: string) => `No one called ${name} in ${group}.`,
    addGuest: (name: string) => `Add ${name} as a guest`,
    leaveOut: (name: string) => `Leave ${name} out`,
    answered: {
      had: (person: string, item: string) => `${person} had the ${item}`,
      paid: (person: string) => `${person} paid`,
      is: (name: string, person: string) => `${name} is ${person}`,
      guest: (name: string) => `${name} joins as a guest`,
      skip: (name: string) => `Leaving ${name} out`,
    },
    change: "Change",
    howMuch: (title: string | null) => `How much was ${title ?? "it"}?`,
    howMuchSub: "You didn’t say a price.",
    amountLabel: "Amount",
    whoPaid: "Who paid?",
    whoPaidSub: { guessed: "You didn’t say, so Bruno picked you.", set: "Got it." },
    you: "You",
    submit: "Make the draft",
    skip: "Skip, I’ll fix it in review",
  },
} as const;
