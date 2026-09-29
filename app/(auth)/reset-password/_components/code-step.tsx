"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { InlineAlert } from "@/components/ui/inline-alert";
import { OtpInput } from "@/components/ui/otp-input";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/errors";
import { authRules } from "@/lib/auth/rules";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { cn } from "@/lib/utils/cn";
import { CodeStatus } from "../../_components/code-status";
import { TextAction } from "../../_components/text-action";
import { authCopy } from "../../_data";
import { useFlash } from "../../_lib/use-flash";
import { useWrongCodeReset } from "../../_lib/use-wrong-code";
import { resetCopy } from "../_data";

export interface CodeStepProps {
  email: string;
  initialError?: string;
  onVerified: (otp: string) => void;
  onChangeEmail: () => void;
}

type CodeState =
  | { readonly status: "entering" }
  | { readonly status: "verifying" }
  | { readonly status: "failed"; readonly message: string };

const SENT_CHIP_MS = 2400;

export function CodeStep({ email, initialError, onVerified, onChangeEmail }: CodeStepProps) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<CodeState>(
    initialError ? { status: "failed", message: initialError } : { status: "entering" },
  );
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
    const { error } = await authClient.emailOtp.checkVerificationOtp({ email, otp, type: "forget-password" });
    if (error) {
      setState({ status: "failed", message: authErrorMessage(error) });
      setShake((n) => n + 1);
      scheduleReset();
      return;
    }
    onVerified(otp);
  };

  const resend = async () => {
    if (cooldown.active || resending) return;
    setResending(true);
    const { error } = await authClient.emailOtp.requestPasswordReset({ email });
    setResending(false);
    if (error) {
      setState({ status: "failed", message: authErrorMessage(error) });
      return;
    }
    cancelReset();
    cooldown.restart();
    setCode("");
    setState({ status: "entering" });
    sent.show();
  };

  const resendDisabled = cooldown.active || resending;
  const failed = state.status === "failed";

  return (
    <div className="grid gap-5">
      <div className="flex h-9 max-w-full items-center gap-2 justify-self-center rounded-control bg-surface pr-1 pl-1.5">
        <Avatar name={email} initials={email.charAt(0).toUpperCase()} tint="blue" size="sm" />
        <span className="truncate text-small font-medium">{email}</span>
        <TextAction
          onClick={onChangeEmail}
          className="h-7 shrink-0 cursor-pointer rounded-sm bg-transparent px-2.5 text-footnote font-semibold text-brand transition-colors hover:bg-brand-tint"
        >
          {resetCopy.code.change}
        </TextAction>
      </div>

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
          disabled={state.status === "verifying"}
          label={copy.label}
          autoFocus
        />
      </div>

      <AnimatePresence initial={false}>
        {state.status === "failed" && <InlineAlert key="failed">{state.message}</InlineAlert>}
      </AnimatePresence>

      <CodeStatus
        mode={state.status === "verifying" ? "checking" : sent.visible ? "sent" : "idle"}
        className="text-small text-text-2"
      >
        <span>
          {copy.noCode}{" "}
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
        <span className="text-footnote text-muted">{copy.expiry}</span>
      </CodeStatus>
    </div>
  );
}
