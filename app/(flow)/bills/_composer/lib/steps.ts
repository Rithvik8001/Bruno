import type { ScanReceipt } from "./scan";

export const FLOW_STEPS = ["items", "claim", "split"] as const;
export type FlowStep = (typeof FLOW_STEPS)[number];

export type ComposerMode =
  | { readonly kind: "create" }
  | { readonly kind: "scan"; readonly scanId: string; readonly receipt: ScanReceipt }
  | { readonly kind: "edit"; readonly billId: string; readonly slug: string; readonly claimCode: string | null };
