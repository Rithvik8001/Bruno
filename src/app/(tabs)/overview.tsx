import { useState } from "react";
import { View } from "react-native";

import {
  CodeSlots,
  Field,
  NativeAlert,
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
  TextLink,
  ToggleRow,
  useAppearance,
  type FilterOption,
} from "@/design";
import { signOut, useSession } from "@/features/auth";

type FilterValue = "all" | "monthly" | "yearly" | "paused";

type PlanValue = "yearly" | "monthly";

const filters: readonly FilterOption<FilterValue>[] = [
  { value: "all", label: "All" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "paused", label: "Paused" },
];

export default function ShowcaseScreen() {
  const { preference, setPreference } = useAppearance();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [plan, setPlan] = useState<PlanValue>("yearly");
  const [reminders, setReminders] = useState(true);
  const [email, setEmail] = useState("rithvik@hey.com");
  const [code, setCode] = useState("491");
  const [password, setPassword] = useState("correcthorse1");
  const [revealed, setRevealed] = useState(false);
  const { session } = useSession();
  const [alertVisible, setAlertVisible] = useState(false);

  return (
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
      <T
        style="moneyXL"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
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
      <LedgerRow
        date="Sep 24"
        name="Netflix"
        amount="$22.99"
        last
        onPress={() => {}}
      />

      <Gap size="s36" />
      <LabelRow label="Settings row · value · chevron" />
      <Gap size="s12" />
      <SettingsRow
        label="Appearance"
        value={
          preference === "system"
            ? "Automatic"
            : preference === "dark"
              ? "Dark"
              : "Light"
        }
        onPress={() =>
          setPreference(
            preference === "system"
              ? "light"
              : preference === "light"
                ? "dark"
                : "system",
          )
        }
      />
      <SettingsRow label="Export as CSV" last onPress={() => {}} />

      <Gap size="s36" />
      <LabelRow label="Toggle · ink track, paper knob" />
      <Gap size="s12" />
      <ToggleRow
        label="Renewal reminders"
        value={reminders}
        onValueChange={setReminders}
      />

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
      <LabelRow label="Field · trailing action · hint" />
      <Gap size="s12" />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!revealed}
        autoCapitalize="none"
        hint="At least 8 characters, with one number."
        trailing={{
          title: revealed ? "Hide" : "Show",
          onPress: () => setRevealed((current) => !current),
        }}
      />

      <Gap size="s36" />
      <LabelRow label="Field · error" />
      <Gap size="s12" />
      <Field
        label="Email"
        value="rithvik@hey"
        editable={false}
        error="That email does not look right."
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
      <Gap size="s36" />
      <LabelRow label="Native alert · system chrome" />
      <Gap size="s12" />
      <TextLink title="Show alert" onPress={() => setAlertVisible(true)} />
      <NativeAlert
        visible={alertVisible}
        title="Email not verified"
        message="Check your inbox for the six-digit code we sent to rithvik@hey.com."
        actions={[{ title: "Cancel", role: "cancel" }, { title: "Verify now" }]}
        onDismiss={() => setAlertVisible(false)}
      />
      {session === null ? null : (
        <>
          <Gap size="s36" />
          <LabelRow label="Session" caption={session.user.email} />
          <Gap size="s12" />
          <TextLink title="Sign out" onPress={signOut} />
        </>
      )}
    </Screen>
  );
}
