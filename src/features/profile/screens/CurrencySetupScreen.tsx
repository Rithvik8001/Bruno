import { useState } from "react";

import { Button, Gap, Screen, T } from "@/design";
import { useAuthAlert } from "@/features/auth";

import { profileCopy } from "../copy";
import { CurrencyList } from "../components/CurrencyList";
import { getDeviceCurrency } from "../deviceCurrency";
import { useProfile } from "../ProfileProvider";

const copy = profileCopy.currency;

export function CurrencySetupScreen() {
  const { create } = useProfile();
  const { alert, showFailure } = useAuthAlert();
  const [deviceCurrency] = useState(getDeviceCurrency);
  const [selected, setSelected] = useState(deviceCurrency);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    const result = await create(selected);
    setSaving(false);
    if (!result.ok) {
      showFailure(result.reason === "network" ? "network" : "unknown");
    }
  };

  return (
    <Screen keyboard>
      <Gap size="s24" />
      <T style="title" accessibilityRole="header">
        {copy.setupTitle}
      </T>
      <Gap size="s8" />
      <T style="body" color="ink2">
        {copy.setupSubtitle}
      </T>
      <Gap size="s24" />
      <CurrencyList
        selected={selected}
        suggested={[deviceCurrency]}
        onSelect={setSelected}
        disabled={saving}
      />
      <Gap size="s16" />
      <Button
        title={copy.setupContinue(selected)}
        variant="accent"
        onPress={submit}
        loading={saving}
      />
      {alert}
    </Screen>
  );
}
