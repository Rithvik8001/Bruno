import { shiftDay } from "@/lib/calendar";
import { EXPORT_KINDS, type ExportFilter, type ExportKind, type ExportRange, type ExportRequest } from "@/lib/export/rules";
import type { ExportedFile } from "./download";

export type ExportView = "form" | "picker" | "done";

export type ExportPhase =
  | { readonly kind: "idle" }
  | { readonly kind: "preparing" }
  | { readonly kind: "failed"; readonly message: string | null }
  | { readonly kind: "limited"; readonly seconds: number };

export type KindPicks = Readonly<Record<ExportKind, boolean>>;

export interface ExportState {
  readonly view: ExportView;
  readonly group: string;
  readonly range: ExportRange;
  readonly from: string;
  readonly to: string;
  readonly kinds: KindPicks;
  readonly phase: ExportPhase;
  readonly file: ExportedFile | null;
}

export type ExportAction =
  | { readonly type: "reset"; readonly state: ExportState }
  | { readonly type: "view"; readonly view: ExportView }
  | { readonly type: "group"; readonly group: string }
  | { readonly type: "range"; readonly range: ExportRange }
  | { readonly type: "from"; readonly day: string }
  | { readonly type: "to"; readonly day: string }
  | { readonly type: "toggle"; readonly kind: ExportKind }
  | { readonly type: "phase"; readonly phase: ExportPhase }
  | { readonly type: "done"; readonly file: ExportedFile };

const CUSTOM_DAYS = 30;
const IDLE: ExportPhase = { kind: "idle" };

export function initialExport(group: string, today: string): ExportState {
  return {
    view: "form",
    group,
    range: "all",
    from: shiftDay(today, -CUSTOM_DAYS),
    to: today,
    kinds: { bills: true, items: true, payments: true },
    phase: IDLE,
    file: null,
  };
}

const settle = (phase: ExportPhase): ExportPhase => (phase.kind === "failed" ? IDLE : phase);

export function exportReducer(state: ExportState, action: ExportAction): ExportState {
  switch (action.type) {
    case "reset":
      return action.state;
    case "view":
      return { ...state, view: action.view };
    case "group":
      return { ...state, group: action.group, view: "form", phase: settle(state.phase) };
    case "range":
      return { ...state, range: action.range, phase: settle(state.phase) };
    case "from":
      return { ...state, from: action.day, to: action.day > state.to ? action.day : state.to, phase: settle(state.phase) };
    case "to":
      return { ...state, to: action.day, from: action.day < state.from ? action.day : state.from, phase: settle(state.phase) };
    case "toggle":
      return { ...state, kinds: { ...state.kinds, [action.kind]: !state.kinds[action.kind] }, phase: settle(state.phase) };
    case "phase":
      return { ...state, phase: action.phase };
    case "done":
      return { ...state, view: "done", phase: IDLE, file: action.file };
  }
}

export function filterOf(state: Pick<ExportState, "group" | "range" | "from" | "to">): ExportFilter {
  return state.range === "custom"
    ? { group: state.group, range: state.range, from: state.from, to: state.to }
    : { group: state.group, range: state.range };
}

export function filterKey(filter: ExportFilter): string {
  return [filter.group, filter.range, filter.from ?? "", filter.to ?? ""].join("|");
}

export function pickedKinds(kinds: KindPicks): ExportKind[] {
  return EXPORT_KINDS.filter((kind) => kinds[kind]);
}

export function requestOf(state: ExportState): ExportRequest {
  return { ...filterOf(state), kinds: pickedKinds(state.kinds) };
}
