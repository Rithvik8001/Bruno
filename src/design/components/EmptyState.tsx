import { View } from "react-native";

import { layout } from "../tokens";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";
import { Button } from "./Button";
import { TextLink } from "./TextLink";

export type EmptyStateAction = {
  title: string;
  onPress: () => void;
};

export type EmptyStateProps = {
  title: string;
  body?: string;
  action?: EmptyStateAction;
  link?: EmptyStateAction;
  align?: "center" | "start";
  inset?: boolean;
};

export function EmptyState({
  title,
  body,
  action,
  link,
  align = "start",
  inset = false,
}: EmptyStateProps) {
  const centered = align === "center";
  const textAlign = centered ? "center" : "left";
  const selfAlign = centered ? "center" : "flex-start";

  return (
    <View
      style={{
        paddingHorizontal: inset ? layout.margin : 0,
        alignItems: selfAlign,
      }}
    >
      <T style="heading" align={textAlign}>
        {title}
      </T>
      {body === undefined ? null : (
        <>
          <Spacer height={layout.emptyState.gap} />
          <T
            style="body"
            color="ink2"
            align={textAlign}
            override={{ maxWidth: layout.emptyState.maxWidth }}
          >
            {body}
          </T>
        </>
      )}
      {action === undefined ? null : (
        <>
          <Spacer height={layout.emptyState.actionGap} />
          <Button title={action.title} onPress={action.onPress} size="s" inline />
        </>
      )}
      {link === undefined ? null : (
        <>
          <Spacer height={layout.emptyState.gap} />
          <View style={{ alignSelf: selfAlign }}>
            <TextLink title={link.title} onPress={link.onPress} />
          </View>
        </>
      )}
    </View>
  );
}
