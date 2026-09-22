import {
  Button,
  HStack,
  Host,
  List,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  listRowBackground,
  listRowInsets,
  listRowSeparatorTint,
  listStyle,
  refreshable,
  scrollContentBackground,
} from "@expo/ui/swift-ui/modifiers";

import { layout, type } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import type { LedgerNoteTone } from "./LedgerRow";

export type LedgerListItem = {
  id: string;
  date: string;
  name: string;
  amount: string;
  note?: string;
  noteTone?: LedgerNoteTone;
  onPress: () => void;
};

export type LedgerListProps = {
  items: readonly LedgerListItem[];
  onRefresh?: () => Promise<void>;
};

export function LedgerList({ items, onRefresh }: LedgerListProps) {
  const theme = useTheme();
  const themeName = useThemeName();

  return (
    <Host
      colorScheme={themeName}
      seedColor={theme.accent}
      style={{ flex: 1 }}
    >
      <List
        modifiers={[
          listStyle("plain"),
          scrollContentBackground("hidden"),
          ...(onRefresh === undefined ? [] : [refreshable(onRefresh)]),
        ]}
      >
        {items.map((item) => (
          <Button
            key={item.id}
            onPress={item.onPress}
            modifiers={[
              buttonStyle("plain"),
              listRowInsets({
                leading: layout.margin,
                trailing: layout.margin,
                top: layout.ledger.rowInset,
                bottom: layout.ledger.rowInset,
              }),
              listRowSeparatorTint(theme.hair),
              listRowBackground(theme.paper),
            ]}
          >
            <HStack alignment="center" spacing={layout.ledger.datePadding}>
              <Text
                modifiers={[
                  font({ size: type.caption.fontSize }),
                  foregroundStyle(theme.ink3),
                  lineLimit(1),
                  frame({ width: layout.dateColumn, alignment: "leading" }),
                ]}
              >
                {item.date}
              </Text>
              <VStack alignment="leading" spacing={layout.ledger.noteGap}>
                <Text
                  modifiers={[
                    font({ size: type.row.fontSize, weight: "medium" }),
                    foregroundStyle(theme.ink),
                    lineLimit(1),
                  ]}
                >
                  {item.name}
                </Text>
                {item.note === undefined ? null : (
                  <Text
                    modifiers={[
                      font({ size: type.sub.fontSize }),
                      foregroundStyle(
                        item.noteTone === "accent" ? theme.accent : theme.ink3,
                      ),
                      lineLimit(1),
                    ]}
                  >
                    {item.note}
                  </Text>
                )}
              </VStack>
              <Spacer />
              <Text
                modifiers={[
                  font({ size: type.row.fontSize, weight: "medium" }),
                  foregroundStyle(theme.ink),
                  lineLimit(1),
                ]}
              >
                {item.amount}
              </Text>
            </HStack>
          </Button>
        ))}
      </List>
    </Host>
  );
}
