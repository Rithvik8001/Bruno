import { isScanMime, maxBytesFor, type ScanMime } from "@/lib/scans/rules";

const EXTENSION_MIME: Readonly<Record<string, ScanMime>> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

const MIB = 1024 * 1024;

export function pickMime(file: File): ScanMime | null {
  const declared = file.type.toLowerCase();
  if (isScanMime(declared)) return declared;
  if (declared === "image/jpg") return "image/jpeg";
  const ext = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
  return EXTENSION_MIME[ext] ?? null;
}

export type FileCheck =
  | { readonly ok: true; readonly mime: ScanMime; readonly size: number }
  | { readonly ok: false; readonly reason: "type" }
  | { readonly ok: false; readonly reason: "size"; readonly maxMb: number };

export function validateFile(file: File): FileCheck {
  const mime = pickMime(file);
  if (!mime) return { ok: false, reason: "type" };
  const max = maxBytesFor(mime);
  if (file.size > max) return { ok: false, reason: "size", maxMb: max / MIB };
  return { ok: true, mime, size: file.size };
}
