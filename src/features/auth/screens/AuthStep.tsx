import type { ReactNode } from "react";

import {
  Button,
  Gap,
  IconAction,
  NavBar,
  Screen,
  Spacer,
  T,
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
    <Screen scroll fill keyboard bounce={false}>
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
      <T style="title" accessibilityRole="header">
        {title}
      </T>
      <Gap size="s8" />
      <T style="body" color="ink2">
        {subtitle}
      </T>
      <Gap size="s24" />
      {children}
      <Spacer grow />
      <Gap size="s24" />
      <Button
        title={primary.title}
        variant="accent"
        onPress={primary.onPress}
        disabled={primary.disabled}
        loading={primary.loading}
      />
      {secondary === undefined ? null : (
        <>
          <Gap size="s12" />
          <Button
            title={secondary.title}
            variant="secondary"
            onPress={secondary.onPress}
          />
        </>
      )}
    </Screen>
  );
}
