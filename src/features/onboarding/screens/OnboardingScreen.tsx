import { router } from "expo-router";
import { View } from "react-native";

import type { AuthMode } from "@/features/auth";
import {
  BrandMark,
  Button,
  Entering,
  Gap,
  Screen,
  Spacer,
  T,
  layout,
} from "@/design";

import { onboardingCopy } from "../copy";

function openAuth(mode: AuthMode) {
  router.push({ pathname: "/auth", params: { mode } });
}

export function OnboardingScreen() {
  return (
    <Screen scroll fill bounce={false}>
      <Spacer height={layout.onboarding.markTop} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: layout.row.gap }}>
        <BrandMark size={layout.onboarding.mark} />
        <T style="title">{onboardingCopy.wordmark}</T>
      </View>
      <Spacer grow />
      <Entering index={0}>
        <T style="display" accessibilityRole="header">
          {onboardingCopy.statement}
        </T>
        <Gap size="s16" />
        <T style="body" color="ink2">
          {onboardingCopy.lede}
        </T>
      </Entering>
      <Spacer grow />
      <Gap size="s32" />
      <Entering index={1}>
        <Button
          title={onboardingCopy.primary}
          variant="accent"
          onPress={() => openAuth("signUp")}
        />
        <Gap size="s12" />
        <Button
          title={onboardingCopy.secondary}
          variant="secondary"
          onPress={() => openAuth("signIn")}
        />
      </Entering>
    </Screen>
  );
}
