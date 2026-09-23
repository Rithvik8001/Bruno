import { CurrencyScreen } from "@/features/profile";
import { useSubscriptions } from "@/features/subscriptions";

export default function CurrencyRoute() {
  const { subscriptions, refresh } = useSubscriptions();
  return (
    <CurrencyScreen
      subscriptionCount={subscriptions.length}
      refreshSubscriptions={refresh}
    />
  );
}
