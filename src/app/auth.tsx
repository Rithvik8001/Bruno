import { router, useLocalSearchParams } from "expo-router";

import { parseAuthMode } from "@/features/auth";
import { Gap, NavRow, Screen, T } from "@/design";

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = parseAuthMode(params.mode);

  return (
    <Screen>
      <NavRow onBack={() => router.back()} />
      <Gap size="s32" />
      <T style="title">Auth.</T>
      <Gap size="s8" />
      <T style="body" color="ink2">
        {mode === "signUp" ? "Creating a new account." : "Signing back in."}
      </T>
    </Screen>
  );
}
