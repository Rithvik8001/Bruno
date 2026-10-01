"use client";

import { motion } from "motion/react";
import { Icon, type IconName } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { AmountInput } from "@/components/ui/amount-input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { currencySymbol } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import type { BillComposer } from "@/lib/groups/queries";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import type { TellPersonAnswer, TellQuestion, TellResult } from "@/lib/tell/result";
import { cn } from "@/lib/utils/cn";
import { tellCopy } from "../_data";
import { candidatesFor, canSubmit, isAnswered, whoContext, type ClarifyState } from "../_lib/clarify";

export interface ClarifyStepProps {
  text: string;
  result: TellResult;
  composer: BillComposer;
  you: PersonId;
  state: ClarifyState;
  pending: boolean;
  onState: (update: (state: ClarifyState) => ClarifyState) => void;
  onSubmit: () => void;
  onSkip: () => void;
}

const optionClass = (on: boolean) =>
  cn(
    "flex cursor-pointer items-center gap-2.5 rounded-tile border-[1.5px] px-3 py-2 text-left text-body font-semibold text-text",
    "transition-[background-color,border-color,color] duration-150 ease-standard hover:border-brand",
    on ? "border-brand bg-brand-tint" : "border-line bg-bg",
  );

interface PersonOptionProps {
  person: PersonView;
  label: string;
  on: boolean;
  onPick: () => void;
}

function PersonOption({ person, label, on, onPick }: PersonOptionProps) {
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      onClick={() => {
        buzz(HAPTICS.select);
        onPick();
      }}
      {...pressMotion()}
      className={cn(optionClass(on), "min-h-14")}
    >
      <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="md" />
      <span className="min-w-0 wrap-anywhere">{label}</span>
    </motion.button>
  );
}

interface ExtraOptionProps {
  icon: IconName;
  label: string;
  on: boolean;
  onPick: () => void;
}

function ExtraOption({ icon, label, on, onPick }: ExtraOptionProps) {
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      onClick={() => {
        buzz(HAPTICS.select);
        onPick();
      }}
      {...pressMotion(true)}
      className={cn(optionClass(on), "min-h-12 px-3.5", on && "text-brand")}
    >
      <Icon name={icon} size={18} strokeWidth={2} className="shrink-0" />
      {label}
    </motion.button>
  );
}

interface QuestionShellProps {
  index: number;
  done: boolean;
  title: string;
  sub: string;
  children: React.ReactNode;
}

function QuestionShell({ index, done, title, sub, children }: QuestionShellProps) {
  return (
    <div className="grid gap-3.5">
      <div className="flex items-start gap-3">
        <span
          data-tint="green"
          className={cn(
            "mt-px grid size-6 shrink-0 place-items-center rounded-full text-caption font-semibold transition-[background-color,color] duration-220 ease-standard",
            done ? "bg-tint-bg text-tint" : "bg-bg text-text-2",
          )}
        >
          {index + 1}
        </span>
        <span className="grid min-w-0 gap-0.5">
          <span className="text-lead leading-6 font-semibold">{title}</span>
          <span className="text-small text-text-2">{sub}</span>
        </span>
      </div>
      {children}
    </div>
  );
}

function AnsweredRow({ answer, onChange }: { answer: string; onChange: () => void }) {
  return (
    <div className="-my-1.5 flex items-center gap-3">
      <CheckIn data-tint="green" className="grid size-6 shrink-0 place-items-center rounded-full bg-tint-bg text-tint">
        <Icon name="check" size={14} strokeWidth={2.6} />
      </CheckIn>
      <span className="min-w-0 flex-1 font-medium wrap-anywhere">{answer}</span>
      <Button variant="link" size="md" onClick={onChange} className="h-11 px-2.5 text-small">
        {tellCopy.clarify.change}
      </Button>
    </div>
  );
}

export function ClarifyStep({ text, result, composer, you, state, pending, onState, onSubmit, onSkip }: ClarifyStepProps) {
  const copy = tellCopy.clarify;
  const questions = result.questions;
  const ready = canSubmit(questions, state);
  const nameOf = (person: PersonView) => (person.id === you ? copy.you : person.displayName);

  const setPerson = (index: number, answer: TellPersonAnswer | null) =>
    onState((current) => {
      const people = { ...current.people };
      if (answer === null) delete people[index];
      else people[index] = answer;
      return { ...current, people };
    });

  const renderWho = (question: Extract<TellQuestion, { kind: "who" }>, order: number) => {
    const mention = result.people[question.person]?.name ?? "";
    const candidates = candidatesFor(result, question.person, composer.members, you);
    const ambiguous = (result.people[question.person]?.memberIds.length ?? 0) > 1;
    const context = whoContext(result, question.person);
    const answer = state.people[question.person];
    if (answer) {
      const picked = answer.kind === "member" ? composer.members.find((m) => m.id === answer.id) : undefined;
      const pickedName = picked ? nameOf(picked) : mention;
      const label =
        answer.kind === "guest"
          ? copy.answered.guest(mention)
          : answer.kind === "skip"
            ? copy.answered.skip(mention)
            : !ambiguous
              ? copy.answered.is(mention, pickedName)
              : context.kind === "item"
                ? copy.answered.had(pickedName, context.item)
                : context.kind === "payer"
                  ? copy.answered.paid(pickedName)
                  : copy.answered.is(mention, pickedName);
      return <AnsweredRow answer={label} onChange={() => setPerson(question.person, null)} />;
    }
    const title = !ambiguous
      ? copy.who(mention)
      : context.kind === "item"
        ? copy.whichHad(mention, context.item)
        : context.kind === "payer"
          ? copy.whichPaid(mention)
          : copy.which(mention);
    return (
      <QuestionShell
        index={order}
        done={false}
        title={title}
        sub={ambiguous ? copy.whichSub(candidates.length, composer.name) : copy.whoSub(mention, composer.name)}
      >
        <div className="grid gap-2">
          {candidates.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(124px,1fr))] gap-2">
              {candidates.map((person) => (
                <PersonOption
                  key={person.id}
                  person={person}
                  label={ambiguous ? person.displayName : firstNameOf(person.displayName)}
                  on={false}
                  onPick={() => setPerson(question.person, { kind: "member", id: person.id })}
                />
              ))}
            </div>
          )}
          {!ambiguous && (
            <>
              <ExtraOption icon="plus" label={copy.addGuest(mention)} on={false} onPick={() => setPerson(question.person, { kind: "guest" })} />
              <ExtraOption icon="close" label={copy.leaveOut(mention)} on={false} onPick={() => setPerson(question.person, { kind: "skip" })} />
            </>
          )}
        </div>
      </QuestionShell>
    );
  };

  const renderAmount = (order: number) => (
    <QuestionShell index={order} done={state.amount !== null && state.amount > 0} title={copy.howMuch(result.title)} sub={copy.howMuchSub}>
      <label className="flex h-14 items-center gap-1.5 rounded-tile border border-border bg-bg px-4 transition-[border-color] duration-150 ease-standard focus-within:border-brand">
        <span className="text-title font-semibold text-muted">{currencySymbol(composer.currency)}</span>
        <AmountInput
          value={state.amount}
          onValueChange={(amount) => onState((current) => ({ ...current, amount }))}
          currency={composer.currency}
          aria-label={copy.amountLabel}
          placeholder="0"
          className="h-13 flex-1 border-0 bg-transparent px-0 text-left text-title hover:bg-transparent focus:border-0 focus:bg-transparent"
        />
      </label>
    </QuestionShell>
  );

  const renderPayer = (order: number) => {
    const picked = state.payerId ?? you;
    return (
      <QuestionShell index={order} done title={copy.whoPaid} sub={state.payerId === null ? copy.whoPaidSub.guessed : copy.whoPaidSub.set}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(124px,1fr))] gap-2">
          {composer.members.map((person) => (
            <PersonOption
              key={person.id}
              person={person}
              label={person.id === you ? copy.you : firstNameOf(person.displayName)}
              on={picked === person.id}
              onPick={() => onState((current) => ({ ...current, payerId: person.id }))}
            />
          ))}
        </div>
      </QuestionShell>
    );
  };

  return (
    <Rise className="grid gap-5">
      <div className="grid gap-1.5">
        <h1 className="m-0 text-heading">{copy.title(questions.length)}</h1>
        <p className="m-0 text-pretty text-text-2">{copy.body(questions.length)}</p>
      </div>
      <div className="flex items-start gap-2.5 rounded-tile bg-surface px-3.5 py-3 text-small text-text-2">
        <Icon name="quote" size={16} className="mt-0.5 shrink-0 text-muted" />
        <span className="min-w-0 wrap-anywhere">{text}</span>
      </div>
      <div className="grid gap-3">
        {questions.map((question, order) => (
          <Rise key={`${question.kind}-${question.kind === "who" ? question.person : ""}`} delay={0.05 * order} className="rounded-card bg-surface p-4">
            {question.kind === "who" ? renderWho(question, order) : question.kind === "amount" ? renderAmount(order) : renderPayer(order)}
          </Rise>
        ))}
      </div>
      <div className="grid gap-1">
        <Button size="lg" fullWidth disabled={!ready} loading={pending} onClick={onSubmit} className="h-13">
          {copy.submit}
        </Button>
        <Button variant="tertiary" size="md" fullWidth disabled={pending} onClick={onSkip} className="h-11 text-small disabled:bg-transparent">
          {copy.skip}
        </Button>
      </div>
      <span className="sr-only" aria-live="polite">
        {questions.filter((question) => isAnswered(question, state)).length}/{questions.length}
      </span>
    </Rise>
  );
}
