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

export function useScreenTop(): number {
  const insets = useSafeAreaInsets();
  return Math.max(layout.top, insets.top + layout.topInset);
}

export function useScreenBottom(): number {
  const insets = useSafeAreaInsets();
  return layout.bottom + insets.bottom;
}

export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return layout.tabBar.height + layout.tabBar.bottom + insets.bottom;
}

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  fill?: boolean;
  padded?: boolean;
  withTabBar?: boolean;
  header?: boolean;
  keyboard?: boolean;
  scrollViewProps?: Omit<ScrollViewProps, "children" | "contentContainerStyle">;
};

export function Screen({
  children,
  scroll = false,
  fill = false,
  padded = true,
  withTabBar = false,
  header = false,
  keyboard = false,
  scrollViewProps,
}: ScreenProps) {
  const theme = useTheme();
  const top = useScreenTop();
  const bottom = useScreenBottom();
  const tabBarSpace = useTabBarSpace();

  const paddingTop = header ? layout.topInset : top;
  const paddingHorizontal = padded ? layout.margin : 0;
  const paddingBottom = withTabBar ? tabBarSpace + layout.bottom : bottom;

  const content = scroll ? (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.canvas }}
      contentContainerStyle={{
        paddingTop,
        paddingBottom,
        paddingHorizontal,
        flexGrow: fill ? 1 : undefined,
      }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps={keyboard ? "handled" : undefined}
      keyboardDismissMode={keyboard ? "interactive" : undefined}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.canvas,
        paddingTop,
        paddingBottom,
        paddingHorizontal,
      }}
    >
      {children}
    </View>
  );

  if (!keyboard) {
    return content;
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: theme.canvas }}
    >
      {content}
    </KeyboardAvoidingView>
  );
}
