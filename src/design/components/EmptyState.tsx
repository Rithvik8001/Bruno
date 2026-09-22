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
  inset?: boolean;
};

export function EmptyState({ title, body, action, link, inset = false }: EmptyStateProps) {
  return (
    <View style={{ paddingHorizontal: inset ? layout.margin : 0 }}>
      <T style="heading">{title}</T>
      {body === undefined ? null : (
        <>
          <Spacer height={layout.emptyState.gap} />
          <T style="caption" color="ink2">
            {body}
          </T>
        </>
      )}
      {action === undefined ? null : (
        <>
          <Spacer height={layout.emptyState.actionGap} />
          <Button title={action.title} onPress={action.onPress} variant="secondary" size="s" inline />
        </>
      )}
      {link === undefined ? null : (
        <>
          <Spacer height={layout.emptyState.gap} />
          <View style={{ alignSelf: "flex-start" }}>
            <TextLink title={link.title} onPress={link.onPress} />
          </View>
        </>
      )}
    </View>
  );
}
