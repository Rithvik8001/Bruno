import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";
import {
  groupArtFor,
  icon3dSrc,
  type GroupArtId,
  type Icon3dId,
  type MomentIconId,
} from "@/lib/design-system/icons3d";
import type { Tint } from "@/lib/design-system/tokens";
import { PopSwap } from "@/components/motion/check-in";
import { cn } from "@/lib/utils/cn";

export interface Icon3dProps {
  icon: Icon3dId;
  size: number;
  label?: string;
  className?: string;
}

export function Icon3d({ icon, size, label, className }: Icon3dProps) {
  return (
    <Image
      src={icon3dSrc(icon)}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      width={size}
      height={size}
      draggable={false}
      className={cn("pointer-events-none select-none", className)}
    />
  );
}

export const artTileVariants = cva("inline-grid shrink-0 place-items-center bg-tint-bg", {
  variants: {
    size: {
      "3xs": "size-5 rounded-[6px]",
      "2xs": "size-6 rounded-[7px]",
      xs: "size-7 rounded-sm",
      sm: "size-9 rounded-control",
      md: "size-11 rounded-tile",
      lg: "size-14 rounded-[18px]",
      xl: "size-18 rounded-card",
    },
  },
  defaultVariants: { size: "md" },
});

export type ArtTileSize = NonNullable<VariantProps<typeof artTileVariants>["size"]>;

const tilePixels = { "3xs": 20, "2xs": 24, xs: 28, sm: 36, md: 44, lg: 56, xl: 72 } as const satisfies Record<ArtTileSize, number>;

export interface MomentTileProps extends VariantProps<typeof artTileVariants> {
  icon: MomentIconId;
  tint: Tint;
  label?: string;
  className?: string;
}

export function MomentTile({ icon, tint, label, size, className }: MomentTileProps) {
  const px = Math.round(tilePixels[size ?? "md"] * 0.7);
  return (
    <span
      data-tint={tint}
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(artTileVariants({ size }), className)}
    >
      <PopSwap swapKey={icon} className="grid">
        <Icon3d icon={icon} size={px} />
      </PopSwap>
    </span>
  );
}

export interface GroupArtTileProps extends VariantProps<typeof artTileVariants> {
  name: string;
  tint: Tint;
  art?: GroupArtId | null;
  className?: string;
}

export function GroupArtTile({ name, tint, art, size, className }: GroupArtTileProps) {
  const px = Math.round(tilePixels[size ?? "md"] * 0.68);
  const icon = groupArtFor(name, art);
  return (
    <span role="img" aria-label={name} data-tint={tint} className={cn(artTileVariants({ size }), className)}>
      <PopSwap swapKey={icon} className="grid">
        <Icon3d icon={icon} size={px} className="translate-y-[2%]" />
      </PopSwap>
    </span>
  );
}
