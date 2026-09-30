import type { ScanCaptions } from "@/components/patterns/receipt-scan";

export const newBillCopy = {
  metaTitle: "Add a bill",
  entry: {
    back: "Home",
    title: "Add a bill",
    body: "Upload the receipt and Bruno's AI pulls out every item. Or type it in yourself.",
    forLabel: "For",
    groupsLabel: "Which group is this for?",
    typeItIn: { title: "Type it in", body: "Add items by hand. Unlimited, always." },
    empty: {
      message: "Bills live in a group. Start one, invite the people you split with, then add the bill.",
      cta: "Start a group",
    },
  },
  scan: {
    dropTitle: "Upload a receipt or drop it here",
    dropActive: "Drop it",
    dropSub: "JPG, PNG, HEIC or PDF. AI reads every line, quantity and price.",
    choose: "Choose file",
    fileLabel: "Receipt file",
    unavailable: "Receipt scanning isn't switched on for this build yet. Type the bill in below.",
    quota: {
      left: (n: number, max: number) => `${n} of ${max} AI extractions left`,
      none: "No extractions left today",
      banner: (max: number) => `You've used today's ${max} AI extractions.`,
      bannerBody: "They reset at midnight, or type this one in below.",
      goPro: "Go Pro",
    },
    cancel: "Cancel",
    failed: {
      title: "Couldn't read that one.",
      body: (reason: string) => `${reason} Try a clearer file, or type the items in. This didn't count against your daily limit.`,
      again: "Upload another",
      type: "Type it in",
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
      type: "Bruno reads JPG, PNG, HEIC, WebP and PDF files.",
      size: (mb: number) => `That file is too big. Keep it under ${mb} MB.`,
      upload: "The upload didn't go through. Check your connection and try again.",
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
