export const scanMessages = {
  unavailable: "Receipt scanning isn't set up yet. Type the bill in instead.",
  badTimeZone: "We couldn't work out your time zone.",
  badType: "Bruno reads JPG, PNG, HEIC, WebP and PDF files.",
  tooLarge: (mb: number) => `That file is too big. Keep it under ${mb} MB.`,
  quota: (limit: number) => `You've used today's ${limit} AI extractions. They reset at midnight.`,
  rateLimited: "That's a lot of uploads at once. Give it a minute.",
  notUploaded: "The upload didn't finish. Try again.",
  unreadable: "That photo is too blurry or dark to read the prices. Take a clearer, well-lit shot straight on.",
  notReceipt: "That doesn't look like a receipt. Upload a photo of the bill itself.",
  timeout: "That took too long to read. Try a clearer photo.",
  noItems: "Bruno couldn't find any priced items on that one.",
  gone: "That scan has expired. Upload the receipt again.",
  failed: "Something went wrong while reading the receipt.",
} as const;

export type ScanFailure = "notUploaded" | "badType" | "tooLarge" | "unreadable" | "notReceipt" | "timeout" | "noItems" | "failed";

export const USER_FIXABLE: ReadonlySet<ScanFailure> = new Set(["badType", "tooLarge", "unreadable", "notReceipt", "noItems"]);

export function failureMessage(failure: ScanFailure): string {
  switch (failure) {
    case "tooLarge":
      return scanMessages.tooLarge(20);
    default:
      return scanMessages[failure];
  }
}
