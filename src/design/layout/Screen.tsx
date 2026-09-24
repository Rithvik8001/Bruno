import type { ReactElement, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  View,
  type ScrollViewProps,
} from "react-native";
import Animated, {
  LinearTransition,
  ReduceMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { layout, motion } from "../tokens";
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

export type ScreenRefresh = {
  refreshing: boolean;
  onRefresh: () => void;
};

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  fill?: boolean;
  padded?: boolean;
  withTabBar?: boolean;
  header?: boolean;
  keyboard?: boolean;
  bounce?: boolean;
  automaticInsets?: boolean;
  refresh?: ScreenRefresh;
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
  bounce = true,
  automaticInsets = false,
  refresh,
  scrollViewProps,
}: ScreenProps) {
  const theme = useTheme();
  const background = theme.canvas;
  const top = useScreenTop();
  const bottom = useScreenBottom();
  const tabBarSpace = useTabBarSpace();

  const paddingTop = header ? layout.topInset : top;
  const paddingHorizontal = padded ? layout.margin : 0;
  const paddingBottom = withTabBar ? tabBarSpace + layout.bottom : bottom;

  const content = scroll ? (
    <ScrollView
      style={{ flex: 1, backgroundColor: background }}
      contentContainerStyle={{
        paddingTop,
        paddingBottom,
        paddingHorizontal,
        flexGrow: fill ? 1 : undefined,
      }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior={automaticInsets ? "automatic" : "never"}
      alwaysBounceVertical={bounce}
      keyboardShouldPersistTaps={keyboard ? "handled" : undefined}
      keyboardDismissMode={keyboard ? "interactive" : undefined}
      refreshControl={
        refresh === undefined ? undefined : (
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={theme.ink3}
          />
        )
      }
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={{
        flex: 1,
        backgroundColor: background,
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
      style={{ flex: 1, backgroundColor: background }}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

export type ScreenListProps<Item> = {
  data: readonly Item[];
  keyExtractor: (item: Item) => string;
  renderItem: (item: Item, index: number) => ReactElement;
  header: ReactElement;
  withTabBar?: boolean;
  underHeader?: boolean;
  automaticInsets?: boolean;
  refresh?: ScreenRefresh;
};

export function ScreenList<Item>({
  data,
  keyExtractor,
  renderItem,
  header,
  withTabBar = false,
  underHeader = false,
  automaticInsets = false,
  refresh,
}: ScreenListProps<Item>) {
  const theme = useTheme();
  const top = useScreenTop();
  const bottom = useScreenBottom();
  const tabBarSpace = useTabBarSpace();

  return (
    <Animated.FlatList
      data={data}
      itemLayoutAnimation={LinearTransition.duration(
        motion.duration.list,
      ).reduceMotion(ReduceMotion.System)}
      keyExtractor={keyExtractor}
      renderItem={({ item, index }) => renderItem(item, index)}
      ListHeaderComponent={header}
      initialNumToRender={layout.list.initialRows}
      windowSize={layout.list.window}
      style={{ flex: 1, backgroundColor: theme.canvas }}
      contentContainerStyle={{
        paddingTop: underHeader ? layout.topInset : top,
        paddingBottom: withTabBar ? tabBarSpace + layout.bottom : bottom,
        paddingHorizontal: layout.margin,
      }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior={automaticInsets ? "automatic" : "never"}
      refreshControl={
        refresh === undefined ? undefined : (
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={theme.ink3}
          />
        )
      }
    />
  );
}
