import { HStack, Host, Spacer as SwiftSpacer, Text } from "@expo/ui/swift-ui";
import {
  Animation,
  animation,
  contentTransition,
  foregroundStyle,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
} from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { layout, motion } from "../tokens";
import { useReduceMotion } from "../theme/useAccessibility";
import { useTheme, useThemeName } from "../theme/useTheme";
import { useSwiftFont } from "../swiftText";
import { useTypeStyle } from "../typography";

export type MoneySize = "money" | "display" | "title";

export type AnimatedMoneyProps = {
  amount: string;
  caption?: string;
  size?: MoneySize;
  animated?: boolean;
};

function digits(amount: string): number {
  const value = Number(amount.replace(/[^0-9]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export function AnimatedMoney({
  amount,
  caption,
  size = "money",
  animated = true,
}: AnimatedMoneyProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const reduceMotion = useReduceMotion();
  const figureFont = useSwiftFont(size);
  const captionFont = useSwiftFont("caption");
  const { lineHeight } = useTypeStyle(size);
  const live = animated && !reduceMotion;

  return (
    <View
      accessible
      accessibilityLabel={caption === undefined ? amount : `${amount} ${caption}`}
    >
      <Host colorScheme={themeName} style={{ alignSelf: "stretch", height: lineHeight }}>
        <HStack alignment="firstTextBaseline" spacing={layout.money.captionGap}>
          <Text
            modifiers={[
              ...figureFont,
              monospacedDigit(),
              lineLimit(1),
              minimumScaleFactor(layout.money.minimumScale),
              foregroundStyle(theme.ink),
              contentTransition(live ? "numericText" : "identity"),
              animation(
                Animation.spring({ duration: motion.duration.count / 1000 }),
                live ? digits(amount) : 0,
              ),
            ]}
          >
            {amount}
          </Text>
          {caption === undefined ? null : (
            <Text modifiers={[...captionFont, foregroundStyle(theme.ink3)]}>
              {caption}
            </Text>
          )}
          <SwiftSpacer />
        </HStack>
      </Host>
    </View>
  );
}
