import type { ExportKind, ExportRange } from "@/lib/export/rules";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const exportCount = (n: number) => n.toLocaleString("en-US");

interface KindCopy {
  readonly name: string;
  readonly one: string;
  readonly many: string;
  readonly description: string;
  readonly columns: readonly string[];
}

export const exportCopy = {
  entry: { label: "Export my data", hint: "CSV" },
  title: "Export your data",
  body: "A spreadsheet file you can open in Excel, Numbers or Google Sheets.",
  groups: {
    label: "Which groups",
    all: "All groups",
    change: "Change",
    back: "Back",
    groupsCap: (n: number) => `${exportCount(n)} ${plural(n, "group", "groups")}`,
    peopleCap: (n: number) => `${exportCount(n)} ${plural(n, "person", "people")}`,
    billsCap: (n: number) => `${exportCount(n)} ${plural(n, "bill", "bills")}`,
  },
  dates: {
    label: "Which dates",
    from: "From",
    to: "To",
    ranges: { all: "All time", year: "This year", lastMonth: "Last month", custom: "Custom" } satisfies Record<ExportRange, string>,
  },
  include: {
    label: "What to include",
    kinds: {
      bills: {
        name: "Bills",
        one: "bill",
        many: "bills",
        description: "One row per bill: date, group, name, who paid, total, your share.",
        columns: ["Date", "Group", "Bill", "Paid by", "Total", "Your share"],
      },
      items: {
        name: "Items",
        one: "item",
        many: "items",
        description: "One row per item on each bill, with who it was split between.",
        columns: ["Date", "Bill", "Item", "Price", "Split between"],
      },
      payments: {
        name: "Payments",
        one: "payment",
        many: "payments",
        description: "One row per payment between people, with its status.",
        columns: ["Date", "From", "To", "Amount", "Status"],
      },
    } satisfies Record<ExportKind, KindCopy>,
  },
  summary: {
    nothingInDates: "Nothing in those dates",
    nothingYet: "Nothing to export yet",
    fromGroups: (n: number) => `from ${exportCount(n)} ${plural(n, "group", "groups")}`,
    fromGroup: (name: string) => `from ${name}`,
    zip: "Comes as a .zip with one file each.",
    big: "This is a big one, it may take a moment.",
    privacy: "Includes bills from groups you’re in, with other members’ names. Amounts stay in each group’s own currency.",
  },
  banner: {
    failed: { title: "Bruno couldn’t build that file", body: "Nothing was downloaded. Your choices are kept." },
    limited: { title: "You’ve exported a few times already.", hour: "Try again in an hour.", minute: "Try again in a minute." },
  },
  actions: {
    cancel: "Cancel",
    pick: "Pick something to export",
    preparing: "Preparing your file…",
    retry: "Try again",
    download: (n: number) => `Download ${n} ${plural(n, "file", "files")}`,
    again: "Download again",
    done: "Done",
  },
  done: {
    title: "Your download has started",
    body: "Look in your downloads folder.",
    filesInside: (n: number) => `${n} ${plural(n, "file", "files")} inside`,
    rows: (n: number) => `${exportCount(n)} ${plural(n, "row", "rows")}`,
  },
  menu: { label: "Export this group", caption: "Bills, items and payments" },
} as const;
