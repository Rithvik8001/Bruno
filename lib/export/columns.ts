import { paymentMethodLabels } from "@/lib/settlements/messages";
import { categoryLabel } from "@/lib/scans/categories";
import { amountCell, EMPTY_CELL, numberCell, textCell, type Column } from "./csv";
import { exportSplitLabels } from "./messages";
import type { BillRow, ItemRow, PaymentRow } from "./rows";

const NAME_JOIN = ", ";

export const billColumns: readonly Column<BillRow>[] = [
  { header: "Date", value: (row) => textCell(row.day) },
  { header: "Group", value: (row) => textCell(row.group) },
  { header: "Bill", value: (row) => textCell(row.title) },
  { header: "Paid by", value: (row) => textCell(row.paidBy) },
  { header: "Currency", value: (row) => textCell(row.currency) },
  { header: "Total", value: (row) => amountCell(row.total, row.currency) },
  { header: "Your share", value: (row) => amountCell(row.yourShare, row.currency) },
  { header: "Split", value: (row) => textCell(exportSplitLabels[row.method]) },
  { header: "Subtotal", value: (row) => amountCell(row.subtotal, row.currency) },
  { header: "Tax", value: (row) => amountCell(row.tax, row.currency) },
  { header: "Tip", value: (row) => amountCell(row.tip, row.currency) },
  { header: "Discount", value: (row) => amountCell(row.discount, row.currency) },
  { header: "Added by", value: (row) => textCell(row.addedBy) },
];

export const itemColumns: readonly Column<ItemRow>[] = [
  { header: "Date", value: (row) => textCell(row.day) },
  { header: "Group", value: (row) => textCell(row.group) },
  { header: "Bill", value: (row) => textCell(row.bill) },
  { header: "Item", value: (row) => textCell(row.name) },
  { header: "Quantity", value: (row) => numberCell(row.quantity) },
  { header: "Category", value: (row) => (row.category ? textCell(categoryLabel[row.category]) : EMPTY_CELL) },
  { header: "Currency", value: (row) => textCell(row.currency) },
  { header: "Price", value: (row) => amountCell(row.price, row.currency) },
  { header: "Split between", value: (row) => textCell(row.between.join(NAME_JOIN)) },
  { header: "Your share", value: (row) => amountCell(row.yourShare, row.currency) },
];

export const paymentColumns: readonly Column<PaymentRow>[] = [
  { header: "Date", value: (row) => textCell(row.day) },
  { header: "Group", value: (row) => textCell(row.group) },
  { header: "From", value: (row) => textCell(row.from) },
  { header: "To", value: (row) => textCell(row.to) },
  { header: "Currency", value: (row) => textCell(row.currency) },
  { header: "Amount", value: (row) => amountCell(row.amount, row.currency) },
  { header: "Method", value: (row) => textCell(paymentMethodLabels[row.method]) },
  { header: "Status", value: (row) => textCell(row.status) },
  { header: "Note", value: (row) => textCell(row.note) },
  { header: "Recorded by", value: (row) => textCell(row.recordedBy) },
];
