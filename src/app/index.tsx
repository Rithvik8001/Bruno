import { Redirect } from "expo-router";

import { useSession } from "@/features/auth";

export default function IndexRoute() {
  const { session } = useSession();

  return <Redirect href={session === null ? "/onboarding" : "/overview"} />;
}
