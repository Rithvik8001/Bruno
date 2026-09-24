import { View } from "react-native";

import { layout, radius } from "../tokens";
import { useTheme } from "../theme/useTheme";
import type { IconSource } from "../types";
import { Entering } from "./Entering";
import { Icon } from "../primitives/Icon";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";
import { Button } from "./Button";

export type InviteBenefit = {
  icon: IconSource;
  title: string;
  caption: string;
};

export type InviteProps = {
  icon: IconSource;
  title: string;
  body: string;
  benefits: readonly InviteBenefit[];
  action: { title: string; onPress: () => void };
};

export function Invite({ icon, title, body, benefits, action }: InviteProps) {
  const theme = useTheme();

  return (
    <View style={{ flexGrow: 1 }}>
      <Spacer height={layout.invite.top} />
      <Entering index={0}>
        <View
          style={{
            width: layout.invite.circle,
            height: layout.invite.circle,
            borderRadius: radius.pill,
            backgroundColor: theme.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            name={icon}
            size={layout.invite.symbol}
            color="onAccent"
            bounce={1}
          />
        </View>
        <Spacer height={layout.invite.top} />
        <T style="title" accessibilityRole="header">
          {title}
        </T>
        <Spacer height={layout.invite.bodyGap} />
        <T style="body" color="ink2">
          {body}
        </T>
      </Entering>
      <Spacer height={layout.invite.benefitsTop} />
      {benefits.map((benefit, index) => (
        <Entering key={benefit.title} index={index + 1}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: layout.invite.iconGap,
              marginBottom: layout.invite.benefitGap,
            }}
          >
            <Icon name={benefit.icon} size={layout.icon.row} />
            <View style={{ flex: 1 }}>
              <T style="bodyMedium">{benefit.title}</T>
              <T
                style="caption"
                color="ink3"
                override={{ marginTop: layout.row.subGap }}
              >
                {benefit.caption}
              </T>
            </View>
          </View>
        </Entering>
      ))}
      <Spacer grow />
      <Spacer height={layout.invite.bottom} />
      <Entering index={benefits.length + 1}>
        <Button title={action.title} onPress={action.onPress} />
      </Entering>
    </View>
  );
}
