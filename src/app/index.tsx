import { Redirect } from "expo-router";

import { useSession } from "@/features/auth";
import { useProfile } from "@/features/profile";

export default function IndexRoute() {
  const { session } = useSession();
  const { status } = useProfile();

  if (session === null) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href={status === "missing" ? "/setup-currency" : "/overview"} />;
}
