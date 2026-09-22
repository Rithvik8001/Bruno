import {
  Button,
  Divider,
  HStack,
  Host,
  List,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  lineLimit,
  buttonStyle,
  contentShape,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  listStyle,
  monospacedDigit,
  overlay,
  scrollContentBackground,
  scrollDisabled,
  shapes,
  type ModifierConfig,
} from "@expo/ui/swift-ui/modifiers";

import { layout, type, weights } from "../tokens";
import type { TypeToken } from "../types";
import { useTheme, useThemeName } from "../theme/useTheme";

export type NativeListTone = "ink" | "ink2";

export type NativeListItem = {
  key: string;
  title: string;
  subtitle?: string;
  value?: string;
  valueNote?: string;
  tone?: NativeListTone;
  onPress?: () => void;
};

export type NativeListProps = {
  items: readonly NativeListItem[];
};

const weightNames = {
  [weights.regular]: "regular",
  [weights.medium]: "medium",
  [weights.semibold]: "semibold",
} as const;

function textFont(token: TypeToken): ModifierConfig {
  return font({
    size: type[token].fontSize,
    weight: weightNames[type[token].fontWeight],
  });
}

export function NativeList({ items }: NativeListProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const height = items.length * layout.list.rowHeight;

  return (
    <Host colorScheme={themeName} seedColor={theme.ink} style={{ height }}>
      <List
        modifiers={[
          listStyle("plain"),
          scrollDisabled(),
          scrollContentBackground("hidden"),
          frame({ height }),
        ]}
      >
        {items.map((item) => {
          const color = item.tone === "ink2" ? theme.ink2 : theme.ink;
          const row = (
            <VStack
              alignment="leading"
              spacing={0}
              modifiers={[
                frame({
                  maxWidth: layout.button.fillWidth,
                  height: layout.list.rowHeight,
                }),
                contentShape(shapes.rectangle()),
              ]}
            >
              <HStack
                alignment="center"
                spacing={layout.row.gap}
                modifiers={[
                  frame({
                    maxWidth: layout.button.fillWidth,
                    height: layout.list.rowHeight - layout.hairline,
                  }),
                ]}
              >
                <VStack alignment="leading" spacing={layout.row.subGap}>
                  <Text
                    modifiers={[
                      textFont("bodyMedium"),
                      foregroundStyle(color),
                      lineLimit(1),
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.subtitle === undefined ? null : (
                    <Text
                      modifiers={[
                        textFont("caption"),
                        foregroundStyle(theme.ink3),
                        lineLimit(1),
                      ]}
                    >
                      {item.subtitle}
                    </Text>
                  )}
                </VStack>
                <Spacer />
                {item.value === undefined ? null : (
                  <VStack alignment="trailing" spacing={layout.row.subGap}>
                    <Text
                      modifiers={[
                        textFont("num"),
                        monospacedDigit(),
                        foregroundStyle(color),
                        lineLimit(1),
                      ]}
                    >
                      {item.value}
                    </Text>
                    {item.valueNote === undefined ? null : (
                      <Text
                        modifiers={[
                          textFont("caption"),
                          foregroundStyle(theme.ink3),
                          lineLimit(1),
                        ]}
                      >
                        {item.valueNote}
                      </Text>
                    )}
                  </VStack>
                )}
              </HStack>
              <Divider
                modifiers={[
                  frame({ height: layout.hairline }),
                  overlay({ color: theme.border }),
                ]}
              />
            </VStack>
          );
          const rowModifiers = [
            listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
            listRowBackground(theme.canvas),
            listRowSeparator("hidden"),
          ];
          return item.onPress === undefined ? (
            <HStack key={item.key} modifiers={rowModifiers}>
              {row}
            </HStack>
          ) : (
            <Button
              key={item.key}
              onPress={item.onPress}
              modifiers={[buttonStyle("plain"), ...rowModifiers]}
            >
              {row}
            </Button>
          );
        })}
      </List>
    </Host>
  );
}
