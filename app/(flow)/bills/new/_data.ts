import type { ScanCaptions } from "@/components/patterns/receipt-scan";
import { allowanceCopy, assistNames } from "@/lib/ai/messages";

export const newBillCopy = {
  metaTitle: "Add a bill",
  entry: {
    back: "Home",
    title: "Add a bill",
    body: "Scan the receipt, say what happened, or type it in.",
    forLabel: "For",
    groupsLabel: "Which group is this for?",
    typeItIn: { title: assistNames.manual, body: "Add items by hand. Unlimited, always." },
    tellBruno: {
      title: assistNames.say,
      body: "Say or type what happened. Bruno drafts the bill.",
      locked: "Today’s assists are used. Back at midnight.",
    },
    empty: {
      message: "Bills live in a group. Start one, invite the people you split with, then add the bill.",
      cta: "Start a group",
    },
  },
  scan: {
    dropTitle: "Upload a receipt or drop it here",
    dropActive: "Drop it",
    dropSub: "JPG, PNG, HEIC, WebP or PDF. Bruno reads every line, quantity and price.",
    choose: "Choose file",
    wait: (seconds: number) => `Try again in ${seconds}s`,
    fileLabel: "Receipt file",
    unavailable: "Scanning isn’t available right now. Type the bill in below.",
    limit: {
      title: allowanceCopy.spent,
      body: (pro: boolean, proLimit: number) => (pro ? allowanceCopy.resets : `${allowanceCopy.resets} ${allowanceCopy.proSoon(proLimit)}`),
    },
    cancel: "Cancel",
    failed: {
      title: "Bruno couldn’t read that one",
      body: (reason: string) => `${reason} ${allowanceCopy.notCounted}`,
      service: {
        title: "Bruno didn’t answer",
        body: `That’s on Bruno, not your receipt. Try again in a moment, or type the items in. ${allowanceCopy.notCounted}`,
      },
      again: "Upload another",
      againIn: (seconds: number) => `Try again in ${seconds}s`,
      type: assistNames.manual,
    },
    done: {
      title: (n: number, total: string | null) => `Read ${n} ${n === 1 ? "item" : "items"}${total ? ` · ${total}` : ""}`,
      sub: (merchant: string | null, flagged: number) => {
        const where = merchant ?? "Receipt";
        if (flagged === 0) return `${where} · everything looked clear.`;
        return `${where} · ${flagged === 1 ? "one price" : `${flagged} prices`} to double-check.`;
      },
      review: "Review items",
    },
    errors: {
      type: "Bruno reads JPG, PNG, HEIC, WebP and PDF files. Upload one of those.",
      size: (mb: number) => `That file is too big. Keep it under ${mb} MB.`,
      upload: "The upload didn’t go through. Check your connection and try again.",
    },
  },
} as const;

export const scanCaptions: ScanCaptions = {
  idle: ["Getting ready…", " "],
  edges: ["Finding the edges…", "Straightening the photo."],
  reading: (name, detail) => [`Spotted ${name}`, detail],
  readingEmpty: ["Reading line by line…", "Looking for items and prices."],
  totalling: ["Adding it up…", "Checking tax and tip match the total."],
  ready: (count, total) => ["Got it all.", `${count} ${count === 1 ? "item" : "items"} · adds up to ${total}`],
  chip: { idle: "Ready", reading: "Reading", found: (n) => `Found ${n}`, ready: "Ready" },
};

export const uploadCaptions = {
  uploading: ["Uploading receipt…", "Sending it over securely."],
} as const;
