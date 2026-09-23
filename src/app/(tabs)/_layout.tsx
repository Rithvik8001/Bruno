import { NativeTabs } from "expo-router/unstable-native-tabs";

import { icons, useTheme } from "@/design";
import { homeCopy } from "@/features/home";

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <NativeTabs
      tintColor={theme.ink}
      iconColor={{ default: theme.ink3, selected: theme.ink }}
    >
      <NativeTabs.Trigger name="overview" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          sf={{ default: icons.tabOverview, selected: icons.tabOverviewSelected }}
        />
        <NativeTabs.Trigger.Label hidden>{homeCopy.tabs.overview}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="subscriptions" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          sf={{
            default: icons.tabSubscriptions,
            selected: icons.tabSubscriptionsSelected,
          }}
        />
        <NativeTabs.Trigger.Label hidden>{homeCopy.tabs.subscriptions}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="insights" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          sf={{ default: icons.tabInsights, selected: icons.tabInsightsSelected }}
        />
        <NativeTabs.Trigger.Label hidden>{homeCopy.tabs.insights}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          sf={{ default: icons.tabSettings, selected: icons.tabSettingsSelected }}
        />
        <NativeTabs.Trigger.Label hidden>{homeCopy.tabs.settings}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
