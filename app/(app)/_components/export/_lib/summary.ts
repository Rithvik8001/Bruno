import {
  addCounts,
  ALL_GROUPS,
  BIG_ROWS,
  countRows,
  NO_COUNTS,
  type ExportGroup,
  type ExportKind,
  type ExportPreview,
  type ExportRange,
} from "@/lib/export/rules";
import { exportCopy, exportCount } from "../_data";

export interface ExportSummary {
  readonly text: string | null;
  readonly empty: boolean;
  readonly zip: boolean;
  readonly big: boolean;
}

const KB = 1024;

function joinParts(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

export function allTimePreview(groups: readonly ExportGroup[], group: string): ExportPreview {
  const scope = group === ALL_GROUPS ? groups : groups.filter((entry) => entry.id === group);
  return { counts: scope.reduce((sum, entry) => addCounts(sum, entry.counts), NO_COUNTS), groups: scope.length };
}

export function summarize(
  preview: ExportPreview | null,
  kinds: readonly ExportKind[],
  range: ExportRange,
  groupName: string | null,
): ExportSummary {
  if (kinds.length === 0 || preview === null) return { text: null, empty: false, zip: kinds.length > 1, big: false };
  const total = countRows(preview.counts, kinds);
  if (total === 0) {
    const { nothingInDates, nothingYet } = exportCopy.summary;
    return { text: range === "all" ? nothingYet : nothingInDates, empty: true, zip: false, big: false };
  }
  const { kinds: words } = exportCopy.include;
  const parts = kinds.map((kind) => {
    const n = preview.counts[kind];
    return `${exportCount(n)} ${n === 1 ? words[kind].one : words[kind].many}`;
  });
  const scope = groupName === null ? exportCopy.summary.fromGroups(preview.groups) : exportCopy.summary.fromGroup(groupName);
  return { text: `${joinParts(parts)} ${scope}`, empty: false, zip: kinds.length > 1, big: total > BIG_ROWS };
}

export function fileSize(bytes: number): string {
  const kb = Math.max(1, Math.round(bytes / KB));
  return kb >= KB ? `${(kb / KB).toFixed(1)} MB` : `${exportCount(kb)} KB`;
}
