import { useLocalSearchParams } from "expo-router";

import {
  SubscriptionDetailScreen,
  parseSubscriptionId,
} from "@/features/subscriptions";

export default function SubscriptionRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  return <SubscriptionDetailScreen id={parseSubscriptionId(params.id)} />;
}
