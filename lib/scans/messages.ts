import { SCAN_MAX_MB } from "./rules";

export const scanMessages = {
  unavailable: "Scanning isn’t available right now. Type the bill in instead.",
  badTimeZone: "Bruno couldn’t read your time zone. Reload the page and try again.",
  badType: "Bruno reads JPG, PNG, HEIC, WebP and PDF files. Upload one of those.",
  tooLarge: (mb: number) => `That file is too big. Keep it under ${mb} MB.`,
  rateLimited: "That’s a lot of uploads at once. Try again in a minute.",
  notUploaded: "The upload didn’t finish. Try again.",
  unreadable: "That photo is too blurry or dark to read the prices. Take a clearer, well-lit shot straight on.",
  notReceipt: "That doesn’t look like a receipt. Upload a photo of the bill itself.",
  timeout: "That took too long to read. Try a clearer photo.",
  noItems: "Bruno couldn’t find any priced items on that one. Upload a photo that shows the prices, or type the items in.",
  gone: "That scan has expired. Upload the receipt again.",
  failed: "Bruno couldn’t read that receipt. Try again, or type the items in.",
} as const;

export type ScanFailure = "notUploaded" | "badType" | "tooLarge" | "unreadable" | "notReceipt" | "timeout" | "noItems" | "failed";

export const USER_FIXABLE: ReadonlySet<ScanFailure> = new Set(["badType", "tooLarge", "unreadable", "notReceipt", "noItems"]);

export function failureMessage(failure: ScanFailure): string {
  switch (failure) {
    case "tooLarge":
      return scanMessages.tooLarge(SCAN_MAX_MB);
    default:
      return scanMessages[failure];
  }
}
