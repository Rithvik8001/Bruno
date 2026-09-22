import { router } from "expo-router";

import type { AuthMode } from "@/features/auth";
import { Button, Gap, Screen, Spacer, T, TextLink, layout } from "@/design";

import { onboardingCopy } from "../copy";

function openAuth(mode: AuthMode) {
  router.push({ pathname: "/auth", params: { mode } });
}

export function OnboardingScreen() {
  return (
    <Screen scroll fill scrollViewProps={{ alwaysBounceVertical: false }}>
      <T style="label" color="ink3">
        {onboardingCopy.wordmark}
      </T>
      <Spacer height={layout.onboarding.statementTop} />
      <T style="statement" accessibilityRole="header">
        {onboardingCopy.statement}
      </T>
      <Gap size="s16" />
      <T style="body" color="ink2">
        {onboardingCopy.lede}
      </T>
      <Spacer grow />
      <Gap size="s32" />
      <Button title={onboardingCopy.primary} onPress={() => openAuth("signUp")} />
      <Gap size="s8" />
      <TextLink title={onboardingCopy.secondary} onPress={() => openAuth("signIn")} />
    </Screen>
  );
}
