import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { useTabBarSpace } from "../components/TabBar";

export function useScreenTop(): number {
  const insets = useSafeAreaInsets();
  return Math.max(layout.top, insets.top + 20);
}

export function useScreenBottom(): number {
  const insets = useSafeAreaInsets();
  return layout.bottom + insets.bottom;
}

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  fill?: boolean;
  padded?: boolean;
  withTabBar?: boolean;
  keyboard?: boolean;
  scrollViewProps?: Omit<ScrollViewProps, "children" | "contentContainerStyle">;
};

export function Screen({
  children,
  scroll = false,
  fill = false,
  padded = true,
  withTabBar = false,
  keyboard = false,
  scrollViewProps,
}: ScreenProps) {
  const theme = useTheme();
  const top = useScreenTop();
  const bottom = useScreenBottom();
  const tabBarSpace = useTabBarSpace();

  const paddingHorizontal = padded ? layout.margin : 0;
  const paddingBottom = withTabBar ? tabBarSpace + layout.bottom : bottom;

  if (scroll) {
    const content = (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.paper }}
        contentContainerStyle={{
          paddingTop: top,
          paddingBottom,
          paddingHorizontal,
          flexGrow: fill ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={keyboard ? "handled" : undefined}
        keyboardDismissMode={keyboard ? "interactive" : undefined}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    );

    if (!keyboard) {
      return content;
    }

    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1, backgroundColor: theme.paper }}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.paper,
        paddingTop: top,
        paddingBottom,
        paddingHorizontal,
      }}
    >
      {children}
    </View>
  );
}
