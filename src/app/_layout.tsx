import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, useBrunoFonts, useTheme } from "@/design";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style="auto" />
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
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
