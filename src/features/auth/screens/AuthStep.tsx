import type { ReactNode } from "react";

import {
  Button,
  Gap,
  IconAction,
  NavBar,
  Screen,
  Spacer,
  T,
  TextLink,
} from "@/design";

import { authCopy } from "../copy";

export type AuthStepPrimary = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export type AuthStepSecondary = {
  title: string;
  onPress: () => void;
};

export type AuthStepProps = {
  title: string;
  subtitle: ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  primary: AuthStepPrimary;
  secondary?: AuthStepSecondary;
  children: ReactNode;
};

export function AuthStep({
  title,
  subtitle,
  onBack,
  onClose,
  primary,
  secondary,
  children,
}: AuthStepProps) {
  return (
    <Screen
      scroll
      fill
      keyboard
      scrollViewProps={{ alwaysBounceVertical: false }}
    >
      <NavBar
        left={
          onBack === undefined ? null : (
            <IconAction
              icon="back"
              onPress={onBack}
              accessibilityLabel={authCopy.step.back}
            />
          )
        }
        right={
          onClose === undefined ? null : (
            <IconAction
              icon="close"
              onPress={onClose}
              accessibilityLabel={authCopy.step.close}
            />
          )
        }
      />
      <Gap size="s24" />
      <T style="heading" accessibilityRole="header">
        {title}
      </T>
      <Gap size="s8" />
      <T style="caption" color="ink2">
        {subtitle}
      </T>
      <Gap size="s24" />
      {children}
      <Spacer grow />
      <Gap size="s24" />
      <Button
        title={primary.title}
        onPress={primary.onPress}
        disabled={primary.disabled}
        loading={primary.loading}
      />
      {secondary === undefined ? null : (
        <>
          <Gap size="s8" />
          <TextLink title={secondary.title} onPress={secondary.onPress} />
        </>
      )}
    </Screen>
  );
}
