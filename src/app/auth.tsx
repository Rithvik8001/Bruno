import { router, useLocalSearchParams } from "expo-router";

import { SignUpScreen, parseAuthMode } from "@/features/auth";
import { Gap, NavRow, Screen, T } from "@/design";

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = parseAuthMode(params.mode);

  if (mode === "signUp") {
    return <SignUpScreen />;
  }

  return (
    <Screen>
      <NavRow onBack={() => router.back()} />
      <Gap size="s32" />
      <T style="title">Auth.</T>
      <Gap size="s8" />
      <T style="body" color="ink2">
        Signing back in.
      </T>
    </Screen>
  );
}
