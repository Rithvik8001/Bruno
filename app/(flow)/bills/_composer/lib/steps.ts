export const FLOW_STEPS = ["items", "claim", "split"] as const;
export type FlowStep = (typeof FLOW_STEPS)[number];

export type ComposerMode =
  | { readonly kind: "create" }
  | { readonly kind: "edit"; readonly billId: string; readonly slug: string };
