import { useLocalSearchParams } from "expo-router";

import {
  EditSubscriptionScreen,
  parseSubscriptionId,
} from "@/features/subscriptions";

export default function EditSubscriptionRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  return <EditSubscriptionScreen id={parseSubscriptionId(params.id)} />;
}
