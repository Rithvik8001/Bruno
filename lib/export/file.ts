import { strToU8, zipSync } from "fflate";
import type { PersonId } from "@/lib/domain/ids";
import { billColumns, itemColumns, paymentColumns } from "./columns";
import { csvFile } from "./csv";
import { EXPORT_KINDS, type ExportKind } from "./rules";
import { billRows, itemRows, paymentRows, type BillSource, type Names, type PaymentSource } from "./rows";

export interface ExportSheet {
  readonly kind: ExportKind;
  readonly rows: number;
  readonly text: string;
}

export interface ExportFile {
  readonly name: string;
  readonly contentType: string;
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly rows: number;
  readonly files: number;
}

interface SheetSource {
  readonly bills: readonly BillSource[];
  readonly payments: readonly PaymentSource[];
  readonly names: Names;
}

const SLUG_MAX = 40;
const CSV_TYPE = "text/csv; charset=utf-8";
const ZIP_TYPE = "application/zip";

function slugOf(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
  return slug || "group";
}

export function exportBaseName(groupName: string | null, today: string): string {
  return groupName === null ? `bruno-export-${today}` : `bruno-${slugOf(groupName)}-${today}`;
}

function sheetOf(kind: ExportKind, source: SheetSource, you: PersonId, now: Date): ExportSheet {
  switch (kind) {
    case "bills": {
      const rows = billRows(source.bills, source.names, you);
      return { kind, rows: rows.length, text: csvFile(billColumns, rows) };
    }
    case "items": {
      const rows = itemRows(source.bills, source.names, you);
      return { kind, rows: rows.length, text: csvFile(itemColumns, rows) };
    }
    case "payments": {
      const rows = paymentRows(source.payments, source.names, now);
      return { kind, rows: rows.length, text: csvFile(paymentColumns, rows) };
    }
  }
}

export function exportSheets(source: SheetSource, kinds: readonly ExportKind[], you: PersonId, now: Date): ExportSheet[] {
  return EXPORT_KINDS.filter((kind) => kinds.includes(kind)).map((kind) => sheetOf(kind, source, you, now));
}

export function exportFile(sheets: readonly ExportSheet[], baseName: string): ExportFile | null {
  const [first] = sheets;
  if (!first) return null;
  const rows = sheets.reduce((sum, sheet) => sum + sheet.rows, 0);
  if (sheets.length === 1) {
    return { name: `${baseName}-${first.kind}.csv`, contentType: CSV_TYPE, bytes: new Uint8Array(strToU8(first.text)), rows, files: 1 };
  }
  const zipped = zipSync(Object.fromEntries(sheets.map((sheet) => [`${sheet.kind}.csv`, strToU8(sheet.text)])));
  return { name: `${baseName}.zip`, contentType: ZIP_TYPE, bytes: new Uint8Array(zipped), rows, files: sheets.length };
}
