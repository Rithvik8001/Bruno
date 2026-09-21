import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  ThemeProvider,
  readStoredPreference,
  useBrunoFonts,
  useTheme,
  useThemeName,
  writeStoredPreference,
} from "@/design";
import { SessionProvider, useSession } from "@/features/auth";

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
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useBrunoFonts();
  const initialPreference = useMemo(readStoredPreference, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider
        initialPreference={initialPreference}
        onPreferenceChange={writeStoredPreference}
      >
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
