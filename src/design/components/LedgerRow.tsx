import { View } from "react-native";

import { layout } from "../tokens";
import { ledgerDateMinimumFontScale } from "../typography";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type LedgerNoteTone = "ink3" | "accent";

export type LedgerRowProps = {
  date: string;
  name: string;
  amount: string;
  note?: string;
  noteTone?: LedgerNoteTone;
  dense?: boolean;
  last?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function LedgerRow({
  date,
  name,
  amount,
  note,
  noteTone = "ink3",
  dense = false,
  last = false,
  onPress,
  accessibilityLabel,
}: LedgerRowProps) {
  const theme = useTheme();

  const content = (
    <View
      style={{
        height: dense ? layout.rowDense : layout.row,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: last ? 0 : layout.hairline,
        borderBottomColor: theme.hair,
      }}
    >
      <T
        style="caption"
        color="ink3"
        override={{
          width: layout.dateColumn,
          paddingRight: layout.ledger.datePadding,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={ledgerDateMinimumFontScale}
      >
        {date}
      </T>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <T style="row" numberOfLines={1} ellipsizeMode="tail">
          {name}
        </T>
        {note === undefined ? null : (
          <T
            style="sub"
            color={noteTone}
            override={{ marginTop: layout.ledger.noteGap }}
          >
            {note}
          </T>
        )}
      </View>
      <T style="row">{amount}</T>
    </View>
  );

  if (onPress === undefined) {
    return content;
  }

  return (
    <Tappable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${name}, ${amount}, ${date}`}
    >
      {content}
    </Tappable>
  );
}
