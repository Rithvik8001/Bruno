import { useLocalSearchParams } from "expo-router";

import { ResetPasswordScreen, parseEmailParam } from "@/features/auth";

export default function ResetRoute() {
  const params = useLocalSearchParams<{ email?: string }>();

  return <ResetPasswordScreen initialEmail={parseEmailParam(params.email)} />;
}
