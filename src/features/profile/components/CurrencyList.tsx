import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";

import {
  EmptyState,
  Gap,
  Icon,
  IconRow,
  Input,
  SectionHeading,
  layout,
} from "@/design";
import {
  currencies,
  findCurrency,
  searchCurrencies,
  type Currency,
} from "@/lib/money";

import { profileCopy } from "../copy";

const copy = profileCopy.currency;

type Entry =
  | { kind: "label"; key: string; title: string }
  | { kind: "currency"; key: string; currency: Currency };

export type CurrencyListProps = {
  selected: string;
  suggested: readonly string[];
  onSelect: (code: string) => void;
  disabled?: boolean;
};

function buildEntries(
  query: string,
  suggested: readonly string[],
): readonly Entry[] {
  if (query.trim().length > 0) {
    return searchCurrencies(query).map((currency) => ({
      kind: "currency",
      key: currency.code,
      currency,
    }));
  }
  const pinned = [...new Set(suggested)]
    .map((code) => findCurrency(code))
    .filter((currency): currency is Currency => currency !== null);
  const pinnedEntries: Entry[] = pinned.map((currency) => ({
    kind: "currency",
    key: `suggested-${currency.code}`,
    currency,
  }));
  const allEntries: Entry[] = currencies.map((currency) => ({
    kind: "currency",
    key: currency.code,
    currency,
  }));
  return pinned.length === 0
    ? allEntries
    : [
        { kind: "label", key: "suggested", title: copy.suggested },
        ...pinnedEntries,
        { kind: "label", key: "all", title: copy.all },
        ...allEntries,
      ];
}

export function CurrencyList({
  selected,
  suggested,
  onSelect,
  disabled = false,
}: CurrencyListProps) {
  const [query, setQuery] = useState("");
  const entries = useMemo(
    () => buildEntries(query, suggested),
    [query, suggested],
  );

  return (
    <View style={{ flex: 1 }}>
      <Input
        label={copy.search}
        value={query}
        onChangeText={setQuery}
        placeholder={copy.searchPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />
      <Gap size="s16" />
      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.key}
        style={{ flex: 1, marginHorizontal: -layout.margin }}
        contentContainerStyle={{ paddingHorizontal: layout.margin }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <>
            <Gap size="s24" />
            <EmptyState
              title={copy.noMatchTitle}
              body={copy.noMatchBody}
            />
          </>
        }
        renderItem={({ item }) =>
          item.kind === "label" ? (
            <SectionHeading size="small" title={item.title} top="s24" />
          ) : (
            <IconRow
              title={item.currency.name}
              value={item.currency.code}
              accessibilityLabel={
                item.currency.code === selected
                  ? `${item.currency.name}, ${item.currency.code}, ${copy.selected}`
                  : undefined
              }
              trailing={
                item.currency.code === selected ? (
                  <Icon name="check" size="inline" bounce={1} />
                ) : undefined
              }
              onPress={
                disabled ? undefined : () => onSelect(item.currency.code)
              }
            />
          )
        }
      />
    </View>
  );
}
