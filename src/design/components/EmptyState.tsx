import { View } from "react-native";

import { layout } from "../tokens";
import { Gap } from "../primitives/Gap";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";
import { Pill } from "./Pill";
import { TextLink } from "./TextLink";

export type EmptyStateAction = {
  title: string;
  onPress: () => void;
};

export type EmptyStateTone = "ink2" | "ink3";

export type EmptyStateProps = {
  body: string;
  tone?: EmptyStateTone;
  link?: EmptyStateAction;
  action?: EmptyStateAction;
  actionAtBottom?: boolean;
  inset?: boolean;
};

export function EmptyState({
  body,
  tone = "ink2",
  link,
  action,
  actionAtBottom = false,
  inset = false,
}: EmptyStateProps) {
  const content = (
    <>
      <T style="body" color={tone}>
        {body}
      </T>
      {link === undefined ? null : (
        <>
          <Gap size="s8" />
          <TextLink title={link.title} onPress={link.onPress} />
        </>
      )}
      {action === undefined ? null : (
        <>
          {actionAtBottom ? (
            <>
              <Spacer grow />
              <Gap size="s24" />
            </>
          ) : (
            <Gap size="s32" />
          )}
          <Pill title={action.title} onPress={action.onPress} />
        </>
      )}
    </>
  );

  if (!inset) {
    return content;
  }

  return (
    <View
      style={{
        paddingHorizontal: layout.margin,
        flexGrow: actionAtBottom ? 1 : undefined,
      }}
    >
      {content}
    </View>
  );
}
