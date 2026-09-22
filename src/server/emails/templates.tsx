import { Text } from "@react-email/components";

import { emailCopy } from "./copy";
import {
  digestMaxRows,
  fill,
  formatCycleName,
  formatEmailDate,
  formatEmailMoney,
  formatEmailMonth,
  formatEmailShortDate,
  formatPer,
  formatRelative,
} from "./format";
import {
  CodeBlock,
  FactRow,
  Layout,
  bodyStyle,
  captionStyle,
  strongStyle,
} from "./Layout";
import { mail } from "./theme";
import type { DigestEmail, RenewalEmail } from "./types";

export function SignupCodeEmail({ code }: { code: string }) {
  return (
    <Layout preview={emailCopy.code.preview}>
      <Text style={bodyStyle}>{emailCopy.code.lead}</Text>
      <CodeBlock code={code} />
      <Text style={bodyStyle}>{emailCopy.code.expiry}</Text>
    </Layout>
  );
}

export function ResetCodeEmail({ code }: { code: string }) {
  return (
    <Layout preview={emailCopy.reset.preview}>
      <Text style={bodyStyle}>{emailCopy.reset.lead}</Text>
      <CodeBlock code={code} />
      <Text style={bodyStyle}>{emailCopy.reset.expiry}</Text>
    </Layout>
  );
}

function Notice({
  preview,
  body,
  hint,
}: {
  preview: string;
  body: string;
  hint: string;
}) {
  return (
    <Layout preview={preview}>
      <Text style={bodyStyle}>{body}</Text>
      <Text style={bodyStyle}>{hint}</Text>
    </Layout>
  );
}

export function AlreadyRegisteredEmail() {
  return <Notice {...emailCopy.alreadyRegistered} />;
}

export function PasswordChangedEmail() {
  return <Notice {...emailCopy.passwordChanged} />;
}

export function WelcomeEmail() {
  return <Notice {...emailCopy.welcome} />;
}

export function AccountDeletedEmail() {
  return <Notice {...emailCopy.accountDeleted} />;
}

export function renewalValues(input: RenewalEmail): Record<string, string> {
  return {
    name: input.name,
    amount: formatEmailMoney(input.amountMinor, input.currency),
    date: formatEmailDate(input.renewsOn),
    when: formatRelative(input.days),
    per: formatPer(input.cycle),
  };
}

export function RenewalReminderEmail({ input }: { input: RenewalEmail }) {
  const values = renewalValues(input);
  return (
    <Layout preview={fill(emailCopy.renewal.preview, values)}>
      <Text style={bodyStyle}>
        <span style={strongStyle}>{input.name}</span>
        {fill(emailCopy.renewal.body, values).slice(input.name.length)}
      </Text>
      <FactRow label={emailCopy.renewal.renews} value={values.date} />
      <FactRow label={emailCopy.renewal.amount} value={values.amount} />
      <FactRow
        label={emailCopy.renewal.every}
        value={formatCycleName(input.cycle)}
        last
      />
      <Text style={{ ...bodyStyle, marginTop: mail.gap }}>
        {emailCopy.renewal.hint}
      </Text>
    </Layout>
  );
}

export function TrialReminderEmail({ input }: { input: RenewalEmail }) {
  const values = renewalValues(input);
  return (
    <Layout preview={fill(emailCopy.trial.preview, values)}>
      <Text style={bodyStyle}>{fill(emailCopy.trial.body, values)}</Text>
      <Text style={bodyStyle}>{fill(emailCopy.trial.after, values)}</Text>
      <Text style={bodyStyle}>{emailCopy.trial.hint}</Text>
    </Layout>
  );
}

export function RenewsTodayEmail({ input }: { input: RenewalEmail }) {
  const values = renewalValues(input);
  return (
    <Layout preview={fill(emailCopy.today.preview, values)}>
      <Text style={bodyStyle}>{fill(emailCopy.today.body, values)}</Text>
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

export function MonthlyDigestEmail({ input }: { input: DigestEmail }) {
  const values = digestValues(input);
  const shown = input.rows.slice(0, digestMaxRows);
  const rest = input.rows.length - shown.length;
  const lead =
    input.rows.length === 0
      ? emailCopy.digest.leadNone
      : input.rows.length === 1
        ? fill(emailCopy.digest.leadOne, values)
        : fill(emailCopy.digest.leadMany, values);

  return (
    <Layout preview={fill(emailCopy.digest.preview, values)}>
      <Text style={{ ...bodyStyle, ...strongStyle }}>{values.month}</Text>
      <Text style={bodyStyle}>{lead}</Text>
      {shown.map((row, index) => (
        <FactRow
          key={`${row.name}-${index}`}
          label={row.name}
          value={`${formatEmailShortDate(row.dueOn)} · ${formatEmailMoney(row.amountMinor, input.currency)}`}
          last={index === shown.length - 1}
        />
      ))}
      {rest > 0 ? (
        <Text style={{ ...captionStyle, marginTop: mail.gap }}>
          {fill(emailCopy.digest.more, { count: String(rest) })}
        </Text>
      ) : null}
      <Text style={{ ...bodyStyle, marginTop: mail.gap }}>
        {fill(emailCopy.digest.monthly, values)}
      </Text>
      {input.topCategory === null ? null : (
        <Text style={bodyStyle}>
          {fill(emailCopy.digest.top, {
            category: input.topCategory.label,
            amount: formatEmailMoney(
              input.topCategory.monthlyMinor,
              input.currency,
            ),
          })}
        </Text>
      )}
    </Layout>
  );
}
