import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  ThemeProvider,
  readStoredPreference,
  useTheme,
  useThemeName,
  writeStoredPreference,
} from "@/design";
import { SessionProvider, useSession } from "@/features/auth";
import { ProfileProvider } from "@/features/profile";
import { SubscriptionsProvider } from "@/features/subscriptions";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const theme = useTheme();
  const themeName = useThemeName();
  const { session, loading } = useSession();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.paper);
  }, [theme.paper]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  const modalOptions = {
    presentation: "fullScreenModal",
    headerShown: true,
    headerTitle: "",
    headerShadowVisible: false,
    headerStyle: { backgroundColor: theme.paper },
  } as const;

  return (
    <>
      <StatusBar style={themeName === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.paper },
        }}
      >
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Protected guard={session === null}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="verify" />
        </Stack.Protected>
        <Stack.Protected guard={session !== null}>
          <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
          <Stack.Screen name="subscription" />
          <Stack.Screen name="add-subscription" options={modalOptions} />
          <Stack.Screen name="edit-subscription" options={modalOptions} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const initialPreference = useMemo(readStoredPreference, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider
        initialPreference={initialPreference}
        onPreferenceChange={writeStoredPreference}
      >
        <SessionProvider>
          <ProfileProvider>
            <SubscriptionsProvider>
              <RootNavigator />
            </SubscriptionsProvider>
          </ProfileProvider>
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
