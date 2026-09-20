import { useState } from "react";
import { View } from "react-native";

import {
  CodeSlots,
  Field,
  FilterTabs,
  Gap,
  LabelRow,
  LedgerRow,
  NavRow,
  Pill,
  PlanRow,
  Screen,
  SettingsRow,
  StatRow,
  T,
  TabBar,
  TextLink,
  ToggleRow,
  useAppearance,
  type FilterOption,
  type TabBarItem,
} from "@/design";

type FilterValue = "all" | "monthly" | "yearly" | "paused";

type TabKey = "overview" | "subscriptions" | "insights" | "settings";

type PlanValue = "yearly" | "monthly";

const filters: readonly FilterOption<FilterValue>[] = [
  { value: "all", label: "All" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "paused", label: "Paused" },
];

const tabs: readonly TabBarItem<TabKey>[] = [
  { key: "overview", label: "Overview", icon: "tabOverview" },
  { key: "subscriptions", label: "Subscriptions", icon: "tabSubscriptions" },
  { key: "insights", label: "Insights", icon: "tabInsights" },
  { key: "settings", label: "Settings", icon: "tabSettings" },
];

export default function Showcase() {
  const { preference, setPreference } = useAppearance();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [tab, setTab] = useState<TabKey>("overview");
  const [plan, setPlan] = useState<PlanValue>("yearly");
  const [reminders, setReminders] = useState(true);
  const [email, setEmail] = useState("rithvik@hey.com");
  const [code, setCode] = useState("491");

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll withTabBar>
        <NavRow onBack={() => {}} action={{ title: "Edit", onPress: () => {} }} />

        <Gap size="s32" />
        <T style="title">Components.</T>
        <Gap size="s8" />
        <T style="body" color="ink2">
          Every element that appears on a screen.
        </T>

        <Gap size="s36" />
        <LabelRow label="Money · display" caption="Overview hero" />
        <Gap size="s12" />
        <T style="moneyXL" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          $161.88
        </T>

        <Gap size="s36" />
        <LabelRow label="Ledger row · date 64 · name · amount" />
        <Gap size="s12" />
        <LedgerRow
          date="Sep 22"
          name="Spotify"
          amount="$11.99"
          note="in 2 days"
          noteTone="accent"
          onPress={() => {}}
        />
        <LedgerRow date="Sep 24" name="Netflix" amount="$22.99" last onPress={() => {}} />

        <Gap size="s36" />
        <LabelRow label="Settings row · value · chevron" />
        <Gap size="s12" />
        <SettingsRow
          label="Appearance"
          value={preference === "system" ? "Automatic" : preference === "dark" ? "Dark" : "Light"}
          onPress={() =>
            setPreference(
              preference === "system" ? "light" : preference === "light" ? "dark" : "system",
            )
          }
        />
        <SettingsRow label="Export as CSV" last onPress={() => {}} />

        <Gap size="s36" />
        <LabelRow label="Toggle · ink track, paper knob" />
        <Gap size="s12" />
        <ToggleRow label="Renewal reminders" value={reminders} onValueChange={setReminders} />

        <Gap size="s36" />
        <LabelRow label="Filter · text with underline" />
        <Gap size="s12" />
        <FilterTabs options={filters} value={filter} onChange={setFilter} />

        <Gap size="s36" />
        <LabelRow label="Field · focused" />
        <Gap size="s12" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Gap size="s36" />
        <LabelRow label="Code slots · serif digits" />
        <Gap size="s12" />
        <CodeSlots value={code} onChangeValue={setCode} />

        <Gap size="s36" />
        <LabelRow label="Plan row · radio" />
        <Gap size="s12" />
        <PlanRow
          name="Yearly"
          note="Two months free"
          price="$19.99"
          selected={plan === "yearly"}
          onSelect={() => setPlan("yearly")}
        />
        <PlanRow
          name="Monthly"
          note="Cancel anytime"
          price="$2.99"
          selected={plan === "monthly"}
          onSelect={() => setPlan("monthly")}
          last
        />

        <Gap size="s36" />
        <LabelRow label="Stat cells" />
        <Gap size="s12" />
        <StatRow
          cells={[
            { value: "$436.81", label: "Paid so far" },
            { value: "19", label: "Payments" },
            { value: "+$3.00", label: "Since July" },
          ]}
        />

        <Gap size="s36" />
        <LabelRow label="Primary pill · secondary link" />
        <Gap size="s12" />
        <Pill title="Get started" onPress={() => {}} />
        <Gap size="s8" />
        <TextLink title="I already have an account" onPress={() => {}} />
      </Screen>

      <TabBar items={tabs} value={tab} onChange={setTab} />
    </View>
  );
}
