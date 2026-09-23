import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  Stack,
  type Theme as NavigationTheme,
} from "expo-router";
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
import { ProfileProvider, useProfile } from "@/features/profile";
import { SubscriptionsProvider } from "@/features/subscriptions";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const theme = useTheme();
  const themeName = useThemeName();
  const { session, loading } = useSession();
  const { status: profileStatus } = useProfile();
  const needsSetup = session !== null && profileStatus === "missing";

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.canvas);
  }, [theme.canvas]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  const base = themeName === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme: NavigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.ink,
      background: theme.canvas,
      card: theme.canvas,
      text: theme.ink,
      border: theme.border,
      notification: theme.ink,
    },
  };

  const modalOptions = {
    presentation: "fullScreenModal",
    headerShown: true,
    headerTitle: "",
    headerShadowVisible: false,
    headerStyle: { backgroundColor: theme.canvas },
  } as const;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={themeName === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.canvas },
        }}
      >
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Protected guard={session === null}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="verify" />
          <Stack.Screen name="reset" />
        </Stack.Protected>
        <Stack.Protected guard={needsSetup}>
          <Stack.Screen name="setup-currency" options={{ animation: "none" }} />
        </Stack.Protected>
        <Stack.Protected guard={session !== null && !needsSetup}>
          <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
          <Stack.Screen name="subscription" />
          <Stack.Screen name="add-subscription" options={modalOptions} />
          <Stack.Screen name="edit-subscription" options={modalOptions} />
          <Stack.Screen name="currency" options={modalOptions} />
        </Stack.Protected>
      </Stack>
    </NavigationThemeProvider>
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
