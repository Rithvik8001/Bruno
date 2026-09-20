import { router } from "expo-router";

import { onboardingCopy } from "@/features/onboarding";
import type { AuthMode } from "@/features/auth";
import { Gap, Pill, Screen, Spacer, T, TextLink, layout } from "@/design";

function openAuth(mode: AuthMode) {
  router.push({ pathname: "/auth", params: { mode } });
}

export default function OnboardingScreen() {
  return (
    <Screen scroll fill scrollViewProps={{ alwaysBounceVertical: false }}>
      <T style="wordmark" color="ink">
        {onboardingCopy.wordmark}
      </T>

      <Spacer height={layout.onboarding.lede} />

      <T style="statement" color="ink" accessibilityRole="header">
        {onboardingCopy.headline}
      </T>

      <Gap size="s20" />

      <T style="body" color="ink2">
        {onboardingCopy.subcopy}
      </T>

      <Gap size="s32" />

      <Spacer grow />

      <Pill title={onboardingCopy.primary} onPress={() => openAuth("signUp")} />

      <Gap size="s8" />

      <TextLink title={onboardingCopy.secondary} onPress={() => openAuth("signIn")} />
    </Screen>
  );
}
