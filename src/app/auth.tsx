import { useLocalSearchParams } from "expo-router";

import { SignInScreen, SignUpScreen, parseAuthMode } from "@/features/auth";

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = parseAuthMode(params.mode);

  return mode === "signUp" ? <SignUpScreen /> : <SignInScreen />;
}
