"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { Rise } from "@/components/motion/rise";
import { OtpInput } from "@/components/ui/otp-input";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/errors";
import { authRules } from "@/lib/auth/rules";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { cn } from "@/lib/utils/cn";
import { authCopy } from "../_data";
import { useFlash } from "../_lib/use-flash";
import { useWrongCodeReset } from "../_lib/use-wrong-code";
import { CodeStatus } from "./code-status";
import { TextAction } from "./text-action";

export interface VerifyStepProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
  backLabel?: string;
}

type VerifyState =
  | { readonly status: "entering" }
  | { readonly status: "verifying" }
  | { readonly status: "failed"; readonly message: string };

const SENT_CHIP_MS = 2400;

export function VerifyStep({ email, onVerified, onBack, backLabel = authCopy.code.back }: VerifyStepProps) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<VerifyState>({ status: "entering" });
  const [shake, setShake] = useState(0);
  const [resending, setResending] = useState(false);
  const cooldown = useCooldown(authRules.otp.resendCooldownSeconds);
  const sent = useFlash(SENT_CHIP_MS);
  const clearCode = useCallback(() => setCode(""), []);
  const { groupRef, scheduleReset, cancelReset } = useWrongCodeReset(clearCode);
  const copy = authCopy.code;

  const verify = async (otp: string) => {
    cancelReset();
    setState({ status: "verifying" });
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp });
    if (error) {
      setState({ status: "failed", message: authErrorMessage(error) });
      setShake((n) => n + 1);
      scheduleReset();
      return;
    }
    onVerified();
  };

  const resend = async () => {
    if (cooldown.active || resending) return;
    setResending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
    setResending(false);
    if (error) {
      setState({ status: "failed", message: authErrorMessage(error) });
      return;
    }
    cancelReset();
    cooldown.restart();
    setState({ status: "entering" });
    setCode("");
    sent.show();
  };

  const resendDisabled = cooldown.active || resending;
  const failed = state.status === "failed";

  return (
    <div className="grid gap-6">
      <div ref={groupRef}>
        <OtpInput
          value={code}
          onChange={(next) => {
            cancelReset();
            setCode(next);
            if (failed) setState({ status: "entering" });
          }}
          onComplete={verify}
          length={authRules.otp.length}
          invalid={failed && code.length > 0}
          shake={shake}
          label={copy.label}
          disabled={state.status === "verifying"}
          autoFocus
        />
      </div>
      <AnimatePresence initial={false}>
        {state.status === "failed" && (
          <Rise
            key="failed"
            role="alert"
            data-tint="red"
            className="flex items-center justify-center gap-1.5 text-footnote font-medium text-tint"
          >
            <Icon name="alert" size={14} strokeWidth={2.2} />
            {state.message}
          </Rise>
        )}
      </AnimatePresence>
      <div className="grid justify-items-center gap-2 text-small text-text-2">
        <CodeStatus mode={state.status === "verifying" ? "checking" : sent.visible ? "sent" : "idle"} className="min-h-7">
          <span>
            {copy.didntGetIt}{" "}
            <TextAction
              onClick={resend}
              disabled={resendDisabled}
              className={cn(
                "inline-block bg-transparent p-0 font-semibold",
                resendDisabled ? "cursor-default text-muted" : "cursor-pointer text-brand",
              )}
            >
              {cooldown.active ? copy.resendIn(cooldown.remaining) : copy.resend}
            </TextAction>
          </span>
        </CodeStatus>
        <TextAction
          onClick={onBack}
          className="cursor-pointer bg-transparent p-0 text-footnote text-muted transition-colors hover:text-text"
        >
          {backLabel}
        </TextAction>
      </div>
    </div>
  );
}
