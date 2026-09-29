"use client";

import { useState } from "react";
import { StepSwap } from "@/components/motion/rise";
import { AuthHeader } from "../../_components/auth-header";
import { RESET_STAGES, resetCopy } from "../_data";
import { CodeStep } from "./code-step";
import { DoneStep } from "./done-step";
import { EmailStep } from "./email-step";
import { NewPasswordStep, type ResetOutcome } from "./new-password-step";
import { ResetJourney } from "./reset-journey";

export interface ResetFlowProps {
  initialEmail: string;
}

type ResetState =
  | { readonly step: "email" }
  | { readonly step: "code"; readonly email: string; readonly error?: string }
  | { readonly step: "password"; readonly email: string; readonly otp: string }
  | ({ readonly step: "done" } & ResetOutcome);

function headerFor(state: ResetState) {
  if (state.step !== "done") return resetCopy.headers[state.step];
  return state.signedIn ? resetCopy.headers.done : resetCopy.headers.doneSignedOut;
}

function positionOf(state: ResetState): number {
  return state.step === "done" ? RESET_STAGES.length : RESET_STAGES.indexOf(state.step);
}

export function ResetFlow({ initialEmail }: ResetFlowProps) {
  const [state, setState] = useState<ResetState>({ step: "email" });
  const [email, setEmail] = useState(initialEmail);
  const header = headerFor(state);

  return (
    <>
      <AuthHeader
        title={header.title}
        subtitle={header.subtitle}
        visual={<ResetJourney position={positionOf(state)} />}
        stepKey={state.step}
      />

      <StepSwap stepKey={state.step}>
        {state.step === "email" && (
          <EmailStep
            email={email}
            onEmailChange={setEmail}
            onCodeSent={(sentTo) => setState({ step: "code", email: sentTo })}
          />
        )}

        {state.step === "code" && (
          <CodeStep
            key={`${state.email}:${state.error ?? ""}`}
            email={state.email}
            initialError={state.error}
            onVerified={(otp) => setState({ step: "password", email: state.email, otp })}
            onChangeEmail={() => setState({ step: "email" })}
          />
        )}

        {state.step === "password" && (
          <NewPasswordStep
            email={state.email}
            otp={state.otp}
            onCodeRejected={(error) => setState({ step: "code", email: state.email, error })}
            onReset={(outcome) => setState({ step: "done", ...outcome })}
          />
        )}

        {state.step === "done" && <DoneStep signedIn={state.signedIn} signedOutCount={state.signedOutCount} />}
      </StepSwap>
    </>
  );
}
