import { emailCopy } from "./copy";
import {
  capitalize,
  digestMaxRows,
  fill,
  formatCycleName,
  formatEmailDate,
  formatEmailMoney,
  formatEmailMonth,
  formatEmailShortDate,
  formatPer,
  formatRelative,
  yearlyAmountMinor,
} from "./format";
import {
  Caption,
  Code,
  Divider,
  Facts,
  Figure,
  Hero,
  Layout,
  LogoList,
  Paragraph,
} from "./Layout";
import type { BatchEmail, DigestEmail, RenewalEmail } from "./types";

export function SignupCodeEmail({ code }: { code: string }) {
  const copy = emailCopy.code;
  return (
    <Layout preview={copy.preview} eyebrow={copy.eyebrow} title={copy.title} footer={null}>
      <Code code={code} />
      <Paragraph>{copy.expiry}</Paragraph>
    </Layout>
  );
}

export function ResetCodeEmail({ code }: { code: string }) {
  const copy = emailCopy.reset;
  return (
    <Layout preview={copy.preview} eyebrow={copy.eyebrow} title={copy.title} footer={null}>
      <Code code={code} />
      <Paragraph>{copy.expiry}</Paragraph>
    </Layout>
  );
}

type NoticeCopy = {
  preview: string;
  eyebrow: string;
  title: string;
  body: string;
  hint: string;
};

function Notice({ copy }: { copy: NoticeCopy }) {
  return (
    <Layout preview={copy.preview} eyebrow={copy.eyebrow} title={copy.title} footer="account">
      <Paragraph>{copy.body}</Paragraph>
      <Paragraph>{copy.hint}</Paragraph>
    </Layout>
  );
}

export function AlreadyRegisteredEmail() {
  return <Notice copy={emailCopy.alreadyRegistered} />;
}

export function PasswordChangedEmail() {
  return <Notice copy={emailCopy.passwordChanged} />;
}

export function WelcomeEmail() {
  return <Notice copy={emailCopy.welcome} />;
}

export function AccountDeletedEmail() {
  return <Notice copy={emailCopy.accountDeleted} />;
}

export function renewalValues(input: RenewalEmail): Record<string, string> {
  const when = formatRelative(input.days);
  return {
    name: input.name,
    amount: formatEmailMoney(input.amountMinor, input.currency),
    yearly: formatEmailMoney(
      yearlyAmountMinor(input.amountMinor, input.cycle),
      input.currency,
    ),
    date: formatEmailDate(input.renewsOn),
    when,
    When: capitalize(when),
    per: formatPer(input.cycle),
  };
}

export function RenewalReminderEmail({ input }: { input: RenewalEmail }) {
  const copy = emailCopy.renewal;
  const values = renewalValues(input);
  return (
    <Layout
      preview={fill(copy.preview, values)}
      eyebrow={copy.eyebrow}
      title={fill(copy.title, values)}
      footer="reminders"
    >
      <Hero
        name={input.name}
        serviceKey={input.serviceKey}
        chip={values.When}
        amount={values.amount}
        per={values.per}
      />
      <Paragraph tone="ink">{fill(copy.body, values)}</Paragraph>
      <Paragraph>{fill(copy.wink, values)}</Paragraph>
      <Divider />
      <Facts
        rows={[
          { label: copy.renews, value: values.date },
          { label: copy.every, value: formatCycleName(input.cycle) },
        ]}
      />
    </Layout>
  );
}

export function TrialReminderEmail({ input }: { input: RenewalEmail }) {
  const copy = emailCopy.trial;
  const values = renewalValues(input);
  return (
    <Layout
      preview={fill(copy.preview, values)}
      eyebrow={copy.eyebrow}
      title={fill(copy.title, values)}
      footer="reminders"
    >
      <Hero
        name={input.name}
        serviceKey={input.serviceKey}
        chip={emailCopy.trialChip}
        amount={values.amount}
        per={values.per}
      />
      <Paragraph tone="ink">{fill(copy.body, values)}</Paragraph>
      <Paragraph>{fill(copy.wink, values)}</Paragraph>
      <Divider />
      <Facts
        rows={[
          { label: copy.ends, value: values.date },
          { label: copy.after, value: `${values.amount} ${values.per}` },
        ]}
      />
    </Layout>
  );
}

export function RenewsTodayEmail({ input }: { input: RenewalEmail }) {
  const copy = emailCopy.renewsToday;
  const values = renewalValues(input);
  return (
    <Layout
      preview={fill(copy.preview, values)}
      eyebrow={copy.eyebrow}
      title={fill(copy.title, values)}
      footer="reminders"
    >
      <Hero
        name={input.name}
        serviceKey={input.serviceKey}
        chip={emailCopy.today}
        amount={values.amount}
        per={values.per}
      />
      <Paragraph tone="ink">{fill(copy.body, values)}</Paragraph>
      <Paragraph>{copy.wink}</Paragraph>
    </Layout>
  );
}

export function batchValues(input: BatchEmail): Record<string, string> {
  return {
    count: String(input.items.length),
    first: input.items[0]?.input.name ?? "",
    rest: String(Math.max(input.items.length - 1, 0)),
  };
}

export function ComingUpEmail({ input }: { input: BatchEmail }) {
  const copy = emailCopy.batch;
  return (
    <Layout
      preview={fill(copy.preview, batchValues(input))}
      eyebrow={copy.eyebrow}
      title={copy.title}
      footer="reminders"
    >
      <Paragraph tone="ink">{copy.lead}</Paragraph>
      <LogoList
        rows={input.items.map((item) => {
          const values = renewalValues(item.input);
          return {
            key: `${item.kind}-${item.subscriptionId}`,
            name: item.input.name,
            serviceKey: item.input.serviceKey,
            sub: fill(copy[item.kind], values),
            amount: values.amount,
          };
        })}
      />
      <Paragraph>{copy.wink}</Paragraph>
    </Layout>
  );
}

export function digestValues(input: DigestEmail): Record<string, string> {
  return {
    month: formatEmailMonth(input.month),
    count: String(input.rows.length),
    total: formatEmailMoney(input.dueTotalMinor, input.currency),
    monthly: formatEmailMoney(input.monthlyMinor, input.currency),
  };
}

export function digestSubject(input: DigestEmail): string {
  const copy = emailCopy.digest;
  return fill(input.rows.length === 0 ? copy.subjectNone : copy.subject, digestValues(input));
}

export function MonthlyDigestEmail({ input }: { input: DigestEmail }) {
  const copy = emailCopy.digest;
  const values = digestValues(input);
  const shown = input.rows.slice(0, digestMaxRows);
  const rest = input.rows.length - shown.length;
  const empty = input.rows.length === 0;

  const facts: { label: string; value: string }[] = [
    { label: copy.monthlyLabel, value: values.monthly },
  ];
  if (input.topCategory !== null) {
    facts.push({
      label: copy.topLabel,
      value: fill(copy.top, {
        category: input.topCategory.label,
        amount: formatEmailMoney(input.topCategory.monthlyMinor, input.currency),
      }),
    });
  }

  return (
    <Layout
      preview={fill(copy.preview, values)}
      eyebrow={copy.eyebrow}
      title={empty ? copy.titleNone : fill(copy.title, values)}
      footer="reminders"
    >
      {empty ? (
        <Paragraph tone="ink">{copy.leadNone}</Paragraph>
      ) : (
        <>
          <Figure
            amount={values.total}
            caption={
              input.rows.length === 1
                ? copy.chargesOne
                : fill(copy.chargesMany, values)
            }
          />
          <LogoList
            rows={shown.map((row, index) => ({
              key: `${row.name}-${index}`,
              name: row.name,
              serviceKey: row.serviceKey,
              sub: formatEmailShortDate(row.dueOn),
              amount: formatEmailMoney(row.amountMinor, input.currency),
            }))}
          />
          {rest > 0 ? (
            <Caption>{fill(copy.more, { count: String(rest) })}</Caption>
          ) : null}
          <Paragraph>{copy.wink}</Paragraph>
        </>
      )}
      <Divider />
      <Facts rows={facts} />
    </Layout>
  );
}
