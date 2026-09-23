import { toDbDate, type CalendarDate } from "@/lib/calendar";

import { emailCopy } from "./emails/copy";
import { fill } from "./emails/format";
import { digestValues, renewalValues } from "./emails/templates";
import type {
  BatchSlot,
  DigestEmail,
  ReminderItem,
  ReminderKind,
  RenewalEmail,
} from "./emails/types";
import { pushTtlSeconds, sendPushMessages, type PushMessage } from "./push";
import { pushCopy } from "./pushCopy";

const batchLines = 4;

type Content = { title: string; body: string; url: string; collapseId: string };

function messages(
  tokens: readonly string[],
  content: Content,
  threadId: string,
): PushMessage[] {
  return tokens.map((to) => ({
    to,
    title: content.title,
    body: content.body,
    data: { url: content.url },
    sound: "default",
    threadId,
    collapseId: content.collapseId,
    ttl: pushTtlSeconds,
  }));
}

function reminderContent(
  kind: ReminderKind,
  subscriptionId: string,
  input: RenewalEmail,
): Content {
  const values = renewalValues(input);
  return {
    title: fill(pushCopy[kind].title, values),
    body: fill(pushCopy[kind].body, values),
    url: fill(pushCopy.urls.subscription, { id: subscriptionId }),
    collapseId: `${kind}/${subscriptionId}/${toDbDate(input.renewsOn)}`,
  };
}

export function pushReminder(
  tokens: readonly string[],
  kind: ReminderKind,
  subscriptionId: string,
  input: RenewalEmail,
): Promise<boolean> {
  return sendPushMessages(
    messages(
      tokens,
      reminderContent(kind, subscriptionId, input),
      pushCopy.threads.reminders,
    ),
  );
}

export function pushBatch(
  tokens: readonly string[],
  items: readonly ReminderItem[],
  day: CalendarDate,
  slot: BatchSlot,
): Promise<boolean> {
  const first = items[0];
  if (first === undefined) {
    return Promise.resolve(false);
  }
  if (items.length === 1) {
    return pushReminder(tokens, first.kind, first.subscriptionId, first.input);
  }
  const shown = items.slice(0, batchLines);
  const lines = shown.map((item) =>
    fill(pushCopy.batch[item.kind], renewalValues(item.input)),
  );
  const rest = items.length - shown.length;
  if (rest > 0) {
    lines.push(fill(pushCopy.batch.more, { count: String(rest) }));
  }
  return sendPushMessages(
    messages(
      tokens,
      {
        title: fill(pushCopy.batch.title, { count: String(items.length) }),
        body: lines.join("\n"),
        url: pushCopy.urls.overview,
        collapseId: `${slot}/${toDbDate(day)}`,
      },
      pushCopy.threads.reminders,
    ),
  );
}

export function pushDigest(
  tokens: readonly string[],
  input: DigestEmail,
): Promise<boolean> {
  const values = digestValues(input);
  const lead =
    input.rows.length === 0
      ? emailCopy.digest.leadNone
      : input.rows.length === 1
        ? fill(emailCopy.digest.leadOne, values)
        : fill(emailCopy.digest.leadMany, values);
  return sendPushMessages(
    messages(
      tokens,
      {
        title: fill(pushCopy.digest.title, values),
        body: `${lead} ${fill(emailCopy.digest.monthly, values)}`,
        url: pushCopy.urls.overview,
        collapseId: `digest/${toDbDate(input.month).slice(0, 7)}`,
      },
      pushCopy.threads.digest,
    ),
  );
}
