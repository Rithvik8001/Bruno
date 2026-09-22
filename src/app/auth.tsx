import { useLocalSearchParams } from "expo-router";

import { AuthScreen, parseAuthMode } from "@/features/auth";

export default function AuthRoute() {
  const params = useLocalSearchParams<{ mode?: string }>();

  return <AuthScreen mode={parseAuthMode(params.mode)} />;
}
