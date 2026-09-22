import { layout } from "../tokens";
import type { SpaceToken } from "../types";
import { Gap } from "../primitives/Gap";
import { Spacer } from "../primitives/Spacer";
import { LabelRow } from "./Label";

export type SectionHeaderProps = {
  label: string;
  caption?: string;
  onPressCaption?: () => void;
  top?: SpaceToken | null;
  bottom?: SpaceToken | "tight";
};

export function SectionHeader({
  label,
  caption,
  onPressCaption,
  top = "s48",
  bottom,
}: SectionHeaderProps) {
  return (
    <>
      {top === null ? null : <Gap size={top} />}
      <LabelRow
        label={label}
        caption={caption}
        onPressCaption={onPressCaption}
      />
      {bottom === undefined ? (
        <Spacer height={layout.sectionHeader.gap} />
      ) : bottom === "tight" ? (
        <Spacer height={layout.sectionHeader.tightGap} />
      ) : (
        <Gap size={bottom} />
      )}
    </>
  );
}
