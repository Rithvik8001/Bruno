import { Redirect, useLocalSearchParams } from "expo-router";

import { VerifyScreen, parseEmailParam } from "@/features/auth";

export default function VerifyRoute() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = parseEmailParam(params.email);

  if (email === null) {
    return <Redirect href={{ pathname: "/auth", params: { mode: "signUp" } }} />;
  }

  return <VerifyScreen email={email} />;
}
