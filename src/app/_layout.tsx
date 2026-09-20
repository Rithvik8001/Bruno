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

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const theme = useTheme();
  const themeName = useThemeName();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.paper);
  }, [theme.paper]);

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
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useBrunoFonts();
  const initialPreference = useMemo(readStoredPreference, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider
        initialPreference={initialPreference}
        onPreferenceChange={writeStoredPreference}
      >
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
