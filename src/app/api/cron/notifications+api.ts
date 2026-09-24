import { subscriptionsCopy } from "@/features/subscriptions/copy";
import {
  fromRow,
  subscriptionColumns,
  type SubscriptionSelection,
} from "@/features/subscriptions/mapping";
import {
  categorySplit,
  derivedStatus,
  isBilling,
  projectMonthly,
  sortByNextRenewal,
  summarize,
} from "@/features/subscriptions/selectors";
import type { Subscription } from "@/features/subscriptions/types";
import {
  addCycles,
  compareDates,
  daysBetween,
  isInTrial,
  nextRenewal,
  toDbDate,
  type CalendarDate,
} from "@/lib/calendar";
import type {
  BatchSlot,
  DigestEmail,
  DigestRow,
  ReminderItem,
  RenewalEmail,
} from "@/server/emails/types";
import { readCronEnv } from "@/server/env";
import { bearerToken, json, secretMatches } from "@/server/http";
import {
  deliverBatch,
  deliverMonthlyDigest,
  deliverReminder,
} from "@/server/mailer";
import {
  checkPushReceipts,
  settlePushOutcomes,
  type PushOutcome,
} from "@/server/push";
import { pushBatch, pushDigest, pushReminder } from "@/server/pushes";
import { supabaseAdmin } from "@/server/supabaseAdmin";
import {
  subrequestCount,
  subrequestTrace,
  trackSubrequests,
} from "@/server/subrequests";

const sendSpacingMs = 550;
const budgetMs = 25_000;
const receiptBudgetMs = 8_000;
const sendsPerRun = 4;
const digestCategories = 3;
const maxDigestCharges = 40;
const fallbackZone = "UTC";

type Kind = "renewal" | "trial" | "renews_today" | "digest";
type Channel = "email" | "push";
type Frequency = "event" | "daily" | "twice";

type ProfileRow = {
  id: string;
  email: string | null;
  currency: string;
  timezone: string | null;
  renewal_reminders: boolean;
  trial_reminders: boolean;
  renews_today: boolean;
  monthly_digest: boolean;
  reminder_lead_days: number;
  push_enabled: boolean;
  email_enabled: boolean;
  notification_frequency: string;
  send_hour: number;
  second_send_hour: number;
};

type Claim = {
  kind: Kind | BatchSlot;
  subscriptionId: string | null;
  dueOn: CalendarDate;
};

type Recipient = { email: string | null; tokens: readonly string[] };

type SendResult = boolean | PushOutcome;

type Planned = {
  userId: string;
  channel: Channel;
  gate: Claim | null;
  claims: Claim[];
  send: (claimed: readonly Claim[]) => Promise<SendResult>;
};

type Context = {
  profiles: ProfileRow[];
  tokens: { user_id: string; token: string }[];
  subscriptions: (SubscriptionSelection & { user_id: string })[];
};

const channels: readonly Channel[] = ["email", "push"];

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat | null {
  const cached = formatters.get(timeZone);
  if (cached !== undefined) {
    return cached;
  }
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      hourCycle: "h23",
    });
    formatters.set(timeZone, formatter);
    return formatter;
  } catch {
    return null;
  }
}

function localParts(
  now: Date,
  timeZone: string,
): { date: CalendarDate; hour: number } | null {
  const formatter = formatterFor(timeZone);
  if (formatter === null) {
    return null;
  }
  const parts = new Map(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );
  const year = Number(parts.get("year"));
  const month = Number(parts.get("month"));
  const day = Number(parts.get("day"));
  const hour = Number(parts.get("hour"));
  if ([year, month, day, hour].some((value) => Number.isNaN(value))) {
    return null;
  }
  return { date: { year, month, day }, hour };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renewalInput(
  subscription: Subscription,
  renewsOn: CalendarDate,
  days: number,
): RenewalEmail {
  return {
    name: subscription.name,
    amountMinor: subscription.amountMinor,
    currency: subscription.currency,
    renewsOn,
    days,
    cycle: subscription.cycle,
  };
}

function digestInput(
  subscriptions: readonly Subscription[],
  today: CalendarDate,
  currency: string,
): DigestEmail {
  const summary = summarize(subscriptions, today, currency);
  const rows: DigestRow[] = [];
  for (const item of summary.billing) {
    for (let k = 0; k < maxDigestCharges; k += 1) {
      const date = addCycles(item.nextRenewal, item.subscription.cycle, k);
      if (date.year !== today.year || date.month !== today.month) {
        break;
      }
      rows.push({
        name: item.subscription.name,
        dueOn: date,
        amountMinor: item.subscription.amountMinor,
      });
    }
  }
  rows.sort((a, b) => compareDates(a.dueOn, b.dueOn));
  const top = categorySplit(summary.billing, digestCategories)[0];
  return {
    month: { year: today.year, month: today.month, day: 1 },
    currency,
    rows,
    dueTotalMinor: projectMonthly(summary.billing, today, 1).months[0].totalMinor,
    monthlyMinor: summary.monthlyMinor,
    topCategory:
      top === undefined
        ? null
        : {
            label: subscriptionsCopy.categories[top.category],
            monthlyMinor: top.monthlyMinor,
          },
  };
}

function reminderItems(
  profile: ProfileRow,
  today: CalendarDate,
  subscriptions: readonly Subscription[],
): ReminderItem[] {
  const items: ReminderItem[] = [];
  const lead = profile.reminder_lead_days;

  for (const item of sortByNextRenewal(subscriptions, today)) {
    const subscription = item.subscription;
    if (!isBilling(derivedStatus(subscription, today))) {
      continue;
    }
    const renewal = nextRenewal(subscription.anchorDate, subscription.cycle, today);
    const days = daysBetween(today, renewal);
    const input = renewalInput(subscription, renewal, days);

    if (days === 0 && profile.renews_today) {
      items.push({
        kind: "renews_today",
        subscriptionId: subscription.id,
        dueOn: renewal,
        input,
      });
    }
    if (days === lead) {
      const endsTrial =
        subscription.trialEndsOn !== null &&
        isInTrial(subscription.trialEndsOn, today) &&
        compareDates(renewal, subscription.trialEndsOn) === 0;
      if (endsTrial && profile.trial_reminders) {
        items.push({
          kind: "trial",
          subscriptionId: subscription.id,
          dueOn: renewal,
          input,
        });
      } else if (!endsTrial && profile.renewal_reminders) {
        items.push({
          kind: "renewal",
          subscriptionId: subscription.id,
          dueOn: renewal,
          input,
        });
      }
    }
  }

  return items;
}

function digestFor(
  profile: ProfileRow,
  today: CalendarDate,
  subscriptions: readonly Subscription[],
): DigestEmail | null {
  return today.day === 1 && profile.monthly_digest
    ? digestInput(subscriptions, today, profile.currency)
    : null;
}

function frequencyOf(value: string): Frequency {
  return value === "daily" || value === "twice" ? value : "event";
}

function slotFor(profile: ProfileRow, hour: number): BatchSlot | null {
  const first = Math.min(profile.send_hour, profile.second_send_hour);
  const second = Math.max(profile.send_hour, profile.second_send_hour);
  if (
    frequencyOf(profile.notification_frequency) === "twice" &&
    second !== first &&
    hour >= second
  ) {
    return "batch_second";
  }
  return hour >= first ? "batch" : null;
}

function itemClaim(item: ReminderItem): Claim {
  return { kind: item.kind, subscriptionId: item.subscriptionId, dueOn: item.dueOn };
}

function sendItem(
  channel: Channel,
  recipient: Recipient,
  item: ReminderItem,
): Promise<SendResult> {
  return channel === "email" && recipient.email !== null
    ? deliverReminder(recipient.email, item.kind, item.subscriptionId, item.input)
    : pushReminder(recipient.tokens, item.kind, item.subscriptionId, item.input);
}

function sendBatch(
  channel: Channel,
  recipient: Recipient,
  userId: string,
  day: CalendarDate,
  slot: BatchSlot,
  items: ReminderItem[],
): Promise<SendResult> {
  return channel === "email" && recipient.email !== null
    ? deliverBatch(recipient.email, userId, day, slot, { items })
    : pushBatch(recipient.tokens, items, day, slot);
}

function sendDigest(
  channel: Channel,
  recipient: Recipient,
  userId: string,
  input: DigestEmail,
): Promise<SendResult> {
  return channel === "email" && recipient.email !== null
    ? deliverMonthlyDigest(recipient.email, userId, input)
    : pushDigest(recipient.tokens, input);
}

function fanOut(
  profile: ProfileRow,
  recipient: Recipient,
  today: CalendarDate,
  slot: BatchSlot,
  items: readonly ReminderItem[],
  digest: DigestEmail | null,
): Planned[] {
  const frequency = frequencyOf(profile.notification_frequency);
  const planned: Planned[] = [];

  for (const channel of channels) {
    if (channel === "email" && (!profile.email_enabled || recipient.email === null)) {
      continue;
    }
    if (channel === "push" && (!profile.push_enabled || recipient.tokens.length === 0)) {
      continue;
    }

    if (frequency === "event") {
      for (const item of items) {
        planned.push({
          userId: profile.id,
          channel,
          gate: null,
          claims: [itemClaim(item)],
          send: () => sendItem(channel, recipient, item),
        });
      }
    } else if (items.length > 0) {
      planned.push({
        userId: profile.id,
        channel,
        gate: { kind: slot, subscriptionId: null, dueOn: today },
        claims: items.map(itemClaim),
        send: (claimed) =>
          sendBatch(
            channel,
            recipient,
            profile.id,
            today,
            slot,
            items.filter((item) =>
              claimed.some(
                (claim) =>
                  claim.kind === item.kind &&
                  claim.subscriptionId === item.subscriptionId,
              ),
            ),
          ),
      });
    }

    if (digest !== null) {
      planned.push({
        userId: profile.id,
        channel,
        gate: null,
        claims: [{ kind: "digest", subscriptionId: null, dueOn: today }],
        send: () => sendDigest(channel, recipient, profile.id, digest),
      });
    }
  }

  return planned;
}

async function loadContext(): Promise<Context> {
  const { data, error } = await supabaseAdmin().rpc("notification_context");
  if (error !== null) {
    throw error;
  }
  const raw = data as unknown as Partial<Context> | null;
  return {
    profiles: raw?.profiles ?? [],
    tokens: raw?.tokens ?? [],
    subscriptions: raw?.subscriptions ?? [],
  };
}

function groupTokens(context: Context): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const row of context.tokens) {
    const list = grouped.get(row.user_id) ?? [];
    list.push(row.token);
    grouped.set(row.user_id, list);
  }
  return grouped;
}

function groupSubscriptions(context: Context): Map<string, Subscription[]> {
  const grouped = new Map<string, Subscription[]>();
  for (const row of context.subscriptions) {
    const subscription = fromRow(row);
    if (subscription === null) {
      continue;
    }
    const list = grouped.get(row.user_id) ?? [];
    list.push(subscription);
    grouped.set(row.user_id, list);
  }
  return grouped;
}

function claimRows(claims: readonly Claim[]) {
  return claims.map((claim) => ({
    kind: claim.kind,
    subscription_id: claim.subscriptionId,
    due_on: toDbDate(claim.dueOn),
  }));
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function delivered(result: SendResult): boolean {
  return typeof result === "boolean" ? result : result.delivered;
}

export async function POST(request: Request): Promise<Response> {
  const token = bearerToken(request);
  if (token === null || !secretMatches(token, readCronEnv().cronSecret)) {
    return json(401, { error: "unauthorized" });
  }

  const startedAt = Date.now();
  const deadline = startedAt + budgetMs;
  const now = new Date();
  trackSubrequests();

  if (new URL(request.url).searchParams.get("task") === "receipts") {
    const receipts = await checkPushReceipts(startedAt + receiptBudgetMs);
    return json(200, { receipts, requests: subrequestCount() });
  }

  try {
    const context = await loadContext();
    const tokens = groupTokens(context);
    const subscriptions = groupSubscriptions(context);

    const planned: Planned[] = [];
    for (const profile of context.profiles) {
      const parts =
        localParts(now, profile.timezone ?? fallbackZone) ??
        localParts(now, fallbackZone);
      if (parts === null) {
        continue;
      }
      const slot = slotFor(profile, parts.hour);
      if (slot === null || (!profile.email_enabled && !profile.push_enabled)) {
        continue;
      }
      const recipient: Recipient = {
        email: profile.email,
        tokens: tokens.get(profile.id) ?? [],
      };
      const list = subscriptions.get(profile.id) ?? [];
      planned.push(
        ...fanOut(
          profile,
          recipient,
          parts.date,
          slot,
          reminderItems(profile, parts.date, list),
          digestFor(profile, parts.date, list),
        ),
      );
    }

    const admin = supabaseAdmin();
    const sent = { email: 0, push: 0 };
    let failed = 0;
    const outcomes: PushOutcome[] = [];
    const releases: { user_id: string; channel: Channel; claims: ReturnType<typeof claimRows> }[] = [];
    const batch = shuffle(planned).slice(0, sendsPerRun);
    const truncated = planned.length > batch.length;

    let claimedPerItem: (Claim[] | null)[] = [];
    if (batch.length > 0) {
      const result = await admin.rpc("claim_batches", {
        p_batches: batch.map((item) => ({
          user_id: item.userId,
          channel: item.channel,
          gate: item.gate === null ? null : claimRows([item.gate])[0],
          claims: claimRows(item.claims),
        })),
      });
      if (result.error !== null) {
        throw result.error;
      }
      const indexes = result.data as unknown as (number[] | null)[];
      claimedPerItem = batch.map((item, position) => {
        const list = indexes[position];
        return list === null || list === undefined
          ? null
          : list
              .map((index) => item.claims[index])
              .filter((entry): entry is Claim => entry !== undefined);
      });
    }

    for (const [position, item] of batch.entries()) {
      const claimed = claimedPerItem[position];
      if (claimed === null || claimed === undefined || claimed.length === 0) {
        continue;
      }
      if (Date.now() > deadline) {
        releases.push({
          user_id: item.userId,
          channel: item.channel,
          claims: claimRows(item.gate === null ? claimed : [item.gate, ...claimed]),
        });
        continue;
      }
      const result = await item.send(claimed);
      if (typeof result !== "boolean") {
        outcomes.push(result);
      }
      if (delivered(result)) {
        sent[item.channel] += 1;
      } else {
        failed += 1;
        releases.push({
          user_id: item.userId,
          channel: item.channel,
          claims: claimRows(item.gate === null ? claimed : [item.gate, ...claimed]),
        });
      }
      if (item.channel === "email") {
        await wait(sendSpacingMs);
      }
    }

    await settlePushOutcomes(outcomes);
    const releaseErrors: string[] = [];
    if (releases.length > 0) {
      const result = await admin.rpc("release_batches", { p_batches: releases });
      if (result.error !== null) {
        releaseErrors.push(result.error.message);
      }
    }

    return json(200, {
      checked: context.profiles.length,
      planned: planned.length,
      attempted: batch.length,
      emailSent: sent.email,
      pushSent: sent.push,
      failed,
      truncated,
      requests: subrequestCount(),
      releaseErrors,
    });
  } catch (error) {
    console.error("[bruno cron] notifications failed", error);
    return json(500, {
      error: "server_error",
      requests: subrequestCount(),
      trace: subrequestTrace(),
      detail: error instanceof Error ? error.message : JSON.stringify(error),
    });
  }
}
