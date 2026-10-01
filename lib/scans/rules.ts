import { BILL_ITEMS_MAX } from "@/lib/bills/schema";
import type { Plan } from "@/lib/generated/prisma/enums";

export const SCAN_LIMITS = { FREE: 3, PRO: 50 } as const satisfies Record<
  Plan,
  number
>;

const MIB = 1024 * 1024;

export const SCAN_IMAGE_MAX_BYTES = 10 * MIB;
export const SCAN_PDF_MAX_BYTES = 10 * MIB;

export const SCAN_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
} as const;

export type ScanMime = keyof typeof SCAN_MIME;

export const SCAN_MIMES = Object.keys(SCAN_MIME) as readonly ScanMime[];

export function isScanMime(value: string): value is ScanMime {
  return value in SCAN_MIME;
}

export function isPdfMime(mime: ScanMime): mime is "application/pdf" {
  return mime === "application/pdf";
}

export function maxBytesFor(mime: ScanMime): number {
  return isPdfMime(mime) ? SCAN_PDF_MAX_BYTES : SCAN_IMAGE_MAX_BYTES;
}

export const UPLOAD_TTL_MS = 55 * 60 * 1000;
export const PDF_PAGES_MAX = 3;
export const SWEEP_CHANCE = 0.01;
export const SWEEP_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
export const SWEEP_BATCH = 20;
export const UPLOAD_TAG = "scan";
export const ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "pdf",
] as const;

const FORMAT_MIME: Readonly<Record<string, ScanMime>> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

export function mimeOfFormat(format: string): ScanMime | null {
  return FORMAT_MIME[format.toLowerCase()] ?? null;
}
export const FLAG_CONFIDENCE = 0.75;
export const MAX_GUESSES = 3;
export const EXTRACT_STALE_MS = 3 * 60 * 1000;
export const EXTRACT_TIMEOUT_MS = 45_000;
export const EXTRACT_MAX_OUTPUT_TOKENS = 8000;
export const DUPLICATE_WINDOW_DAYS = 3;
export const SCAN_ITEMS_MAX = BILL_ITEMS_MAX;
export const SCAN_MODEL = "gpt-5.6-luna";
export const TRANSFORM_WIDTH = 1600;
export const SCANS_PREFIX = "scans";
export const BILLS_PREFIX = "bills";
