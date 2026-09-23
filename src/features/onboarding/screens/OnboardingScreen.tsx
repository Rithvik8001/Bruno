import { router } from "expo-router";

import type { AuthMode } from "@/features/auth";
import { BrandMark, Button, Gap, Screen, Spacer, T, TextLink, layout } from "@/design";

import { onboardingCopy } from "../copy";

function openAuth(mode: AuthMode) {
  router.push({ pathname: "/auth", params: { mode } });
}

export function OnboardingScreen() {
  return (
    <Screen scroll fill scrollViewProps={{ alwaysBounceVertical: false }}>
      <Spacer height={layout.onboarding.markTop} />
      <BrandMark size={layout.onboarding.mark} />
      <Spacer height={layout.onboarding.markGap} />
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
