import type { ReactNode } from "react";

import { CodeInput, Gap, Spacer, T, TextLink, layout } from "@/design";

import { authCopy } from "../copy";
import { formatCountdown } from "../useResendCountdown";
import { isValidCode } from "../validation";
import { AuthStep } from "./AuthStep";

export type CodeStepProps = {
  title: string;
  subtitle: ReactNode;
  code: string;
  onChangeCode: (value: string) => void;
  onSubmit: (value: string) => void;
  submitting: boolean;
  error?: string;
  remaining: number;
  onResend: () => void;
  resending: boolean;
  primaryTitle: string;
  secondaryTitle: string;
  onSecondary: () => void;
  onBack?: () => void;
  children?: ReactNode;
};

export function CodeStep({
  title,
  subtitle,
  code,
  onChangeCode,
  onSubmit,
  submitting,
  error,
  remaining,
  onResend,
  resending,
  primaryTitle,
  secondaryTitle,
  onSecondary,
  onBack,
  children,
}: CodeStepProps) {
  return (
    <AuthStep
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      primary={{
        title: primaryTitle,
        onPress: () => onSubmit(code),
        disabled: submitting || !isValidCode(code),
        loading: submitting,
      }}
      secondary={{ title: secondaryTitle, onPress: onSecondary }}
    >
      <T style="label" color="ink3">
        {authCopy.verify.codeLabel}
      </T>
      <Spacer height={layout.field.labelGap} />
      <CodeInput
        value={code}
        onChangeValue={onChangeCode}
        onComplete={onSubmit}
        error={error !== undefined}
        autoFocus
      />
      {error === undefined ? null : (
        <>
          <Spacer height={layout.field.hintGap} />
          <T style="caption" color="ink2">
            {error}
          </T>
        </>
      )}
      <Gap size="s16" />
      {remaining > 0 ? (
        <T style="caption" color="ink3">
          {authCopy.verify.resendIn}
          {formatCountdown(remaining)}
        </T>
      ) : (
        <TextLink title={authCopy.verify.resend} onPress={onResend} disabled={resending} />
      )}
      {children}
    </AuthStep>
  );
}
