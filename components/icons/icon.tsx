import type { SVGProps } from "react";
import { iconography } from "@/lib/design-system/tokens";
import { iconRegistry, type IconName } from "./registry";

export interface IconProps
  extends Omit<SVGProps<SVGSVGElement>, "children" | "width" | "height"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function Icon({
  name,
  size = iconography.inline,
  strokeWidth = iconography.strokeWidth,
  label,
  ...rest
}: IconProps) {
  const def: { readonly filled?: boolean; readonly node: React.ReactNode } =
    iconRegistry[name];
  const a11y = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true } as const);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      focusable="false"
      {...(def.filled
        ? { fill: "currentColor", stroke: "none" }
        : {
            "data-duotone": "",
            fill: "none",
            stroke: "currentColor",
            strokeWidth,
            strokeLinecap: "round" as const,
            strokeLinejoin: "round" as const,
          })}
      {...a11y}
      {...rest}
    >
      {def.node}
    </svg>
  );
}

export type { IconName };
