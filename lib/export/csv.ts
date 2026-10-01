import { minorUnitsOf, type CurrencyCode } from "@/lib/currency";
import type { Cents } from "@/lib/money";

declare const cellBrand: unique symbol;
export type CsvCell = string & { readonly [cellBrand]: "CsvCell" };

export interface Column<Row> {
  readonly header: string;
  readonly value: (row: Row) => CsvCell;
}

const BOM = "﻿";
const LINE_END = "\r\n";
const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]|^\s|\s$/;

function quote(value: string): string {
  return NEEDS_QUOTES.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function textCell(value: string): CsvCell {
  return quote(FORMULA_START.test(value) ? `'${value}` : value) as CsvCell;
}

export function numberCell(value: number): CsvCell {
  return String(Math.trunc(value)) as CsvCell;
}

export const EMPTY_CELL = "" as CsvCell;

export function plainAmount(value: Cents, code: CurrencyCode): string {
  const minorUnits = minorUnitsOf(code);
  const scale = 10 ** minorUnits;
  const abs = Math.abs(value);
  const whole = String(Math.trunc(abs / scale));
  const body = minorUnits === 0 ? whole : `${whole}.${String(abs % scale).padStart(minorUnits, "0")}`;
  return value < 0 ? `-${body}` : body;
}

export function amountCell(value: Cents | null, code: CurrencyCode): CsvCell {
  return value === null ? EMPTY_CELL : (plainAmount(value, code) as CsvCell);
}

export function csvFile<Row>(columns: readonly Column<Row>[], rows: readonly Row[]): string {
  const head = columns.map((column) => textCell(column.header)).join(",");
  const body = rows.map((row) => columns.map((column) => column.value(row)).join(","));
  return `${BOM}${[head, ...body].join(LINE_END)}${LINE_END}`;
}
