import { Stack } from "expo-router";

import { fonts, useTheme } from "@/design";
import { subscriptionsCopy } from "@/features/subscriptions";

export default function SubscriptionsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: theme.ink,
        headerStyle: { backgroundColor: theme.canvas },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.serif, color: theme.ink },
        contentStyle: { backgroundColor: theme.canvas },
      }}
    >
      <Stack.Screen name="index" options={{ title: subscriptionsCopy.list.title }} />
    </Stack>
  );
}
