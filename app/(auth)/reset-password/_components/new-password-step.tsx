"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { InlineAlert } from "@/components/ui/inline-alert";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage, hasAuthErrorCode } from "@/lib/auth/errors";
import { PasswordField } from "../../_components/password-field";
import { resetCopy } from "../_data";
import { isPasswordAcceptable, passwordRules } from "../_lib/password-rules";

export interface ResetOutcome {
  readonly signedIn: boolean;
  readonly signedOutCount: number;
}

export interface NewPasswordStepProps {
  email: string;
  otp: string;
  onCodeRejected: (message: string) => void;
  onReset: (outcome: ResetOutcome) => void;
}

async function signOutOtherDevices(): Promise<number> {
  const { data: sessions } = await authClient.listSessions();
  const { error } = await authClient.revokeOtherSessions();
  if (error || !sessions) return 0;
  return Math.max(0, sessions.length - 1);
}

export function NewPasswordStep({ email, otp, onCodeRejected, onReset }: NewPasswordStepProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [visible, setVisible] = useState(false);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const copy = resetCopy.password;

  const rules = passwordRules(password, email);
  const matches = confirm.length > 0 && confirm === password;
  const canSave = isPasswordAcceptable(password, email) && matches;
  const showMismatch = confirmTouched && confirm.length > 0 && !matches;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSave || loading) return;
    setLoading(true);
    setFormError(null);

    const { error } = await authClient.emailOtp.resetPassword({ email, otp, password });
    if (error) {
      setLoading(false);
      if (hasAuthErrorCode(error, "INVALID_OTP", "OTP_EXPIRED", "TOO_MANY_ATTEMPTS", "USER_NOT_FOUND")) {
        onCodeRejected(authErrorMessage(error));
        return;
      }
      setFormError(authErrorMessage(error));
      return;
    }

    const { error: signInError } = await authClient.signIn.email({ email, password, rememberMe: true });
    if (signInError) {
      onReset({ signedIn: false, signedOutCount: 0 });
      return;
    }
    onReset({ signedIn: true, signedOutCount: signOutOthers ? await signOutOtherDevices() : 0 });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <div className="grid gap-2">
        <PasswordField
          name="new-password"
          label={copy.label}
          autoComplete="new-password"
          autoFocus
          placeholder={copy.placeholder}
          value={password}
          onValueChange={(value) => {
            setPassword(value);
            setFormError(null);
          }}
          visible={visible}
          onVisibleChange={setVisible}
        />
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {rules.map((rule) => (
            <li key={rule.id}>
              <Chip tint={rule.ok ? "green" : "muted"} size="sm" className="font-medium transition-colors duration-200">
                {rule.ok ? (
                  <CheckIn className="grid place-items-center">
                    <Icon name="check" size={14} strokeWidth={2.2} />
                  </CheckIn>
                ) : (
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                )}
                {rule.label}
              </Chip>
            </li>
          ))}
        </ul>
      </div>
      <PasswordField
        name="confirm-password"
        label={copy.confirmLabel}
        autoComplete="new-password"
        placeholder={copy.confirmPlaceholder}
        value={confirm}
        onValueChange={setConfirm}
        onBlur={() => setConfirmTouched(true)}
        visible={visible}
        showToggle={false}
        feedback={
          showMismatch
            ? { tone: "error", message: copy.mismatch }
            : matches
              ? { tone: "success", message: copy.match }
              : undefined
        }
      />
      <Checkbox
        checked={signOutOthers}
        onChange={(e) => setSignOutOthers(e.target.checked)}
        className="text-small text-text-2"
      >
        {copy.signOutOthers}
      </Checkbox>
      {formError && <InlineAlert>{formError}</InlineAlert>}
      <Button type="submit" size="lg" fullWidth loading={loading} disabled={!canSave} className="font-semibold">
        {copy.submit}
      </Button>
    </form>
  );
}
