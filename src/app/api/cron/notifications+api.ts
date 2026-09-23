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
import { checkPushReceipts } from "@/server/push";
import { pushBatch, pushDigest, pushReminder } from "@/server/pushes";
import { supabaseAdmin } from "@/server/supabaseAdmin";

const pageSize = 1000;
const userChunk = 200;
const sendSpacingMs = 550;
const budgetMs = 50_000;
const receiptBudgetMs = 8_000;
const digestCategories = 3;
const maxDigestCharges = 40;
const fallbackZone = "UTC";

type Kind = "renewal" | "trial" | "renews_today" | "digest";
type Channel = "email" | "push";
type Frequency = "event" | "daily" | "twice";

type ProfileRow = {
  id: string;
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

type Planned = {
  userId: string;
  channel: Channel;
  gate: Claim | null;
  claims: Claim[];
  send: (claimed: readonly Claim[]) => Promise<boolean>;
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
): Promise<boolean> {
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
): Promise<boolean> {
  return channel === "email" && recipient.email !== null
    ? deliverBatch(recipient.email, userId, day, slot, { items })
    : pushBatch(recipient.tokens, items, day, slot);
}

function sendDigest(
  channel: Channel,
  recipient: Recipient,
  userId: string,
  input: DigestEmail,
): Promise<boolean> {
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

async function loadProfiles(): Promise<ProfileRow[]> {
  const admin = supabaseAdmin();
  const rows: ProfileRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("profiles")
      .select(
        "id, currency, timezone, renewal_reminders, trial_reminders, renews_today, monthly_digest, reminder_lead_days, push_enabled, email_enabled, notification_frequency, send_hour, second_send_hour",
      )
      .order("id")
      .range(from, from + pageSize - 1);
    if (error !== null) {
      throw error;
    }
    rows.push(...data);
    if (data.length < pageSize) {
      return rows;
    }
  }
}

async function loadEmails(): Promise<Map<string, string>> {
  const admin = supabaseAdmin().auth.admin;
  const emails = new Map<string, string>();
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage: pageSize });
    if (error !== null) {
      throw error;
    }
    for (const user of data.users) {
      if (user.email !== undefined) {
        emails.set(user.id, user.email);
      }
    }
    if (data.users.length < pageSize) {
      return emails;
    }
  }
}

async function loadPushTokens(
  userIds: readonly string[],
): Promise<Map<string, string[]>> {
  const admin = supabaseAdmin();
  const grouped = new Map<string, string[]>();
  for (let start = 0; start < userIds.length; start += userChunk) {
    const chunk = userIds.slice(start, start + userChunk);
    const { data, error } = await admin
      .from("push_tokens")
      .select("user_id, token")
      .in("user_id", chunk);
    if (error !== null) {
      throw error;
    }
    for (const row of data as { user_id: string; token: string }[]) {
      const list = grouped.get(row.user_id) ?? [];
      list.push(row.token);
      grouped.set(row.user_id, list);
    }
  }
  return grouped;
}

async function loadSubscriptions(
  userIds: readonly string[],
): Promise<Map<string, Subscription[]>> {
  const admin = supabaseAdmin();
  const grouped = new Map<string, Subscription[]>();
  for (let start = 0; start < userIds.length; start += userChunk) {
    const chunk = userIds.slice(start, start + userChunk);
    const { data, error } = await admin
      .from("subscriptions")
      .select(`${subscriptionColumns}, user_id`)
      .in("user_id", chunk)
      .eq("status", "active");
    if (error !== null) {
      throw error;
    }
    for (const row of data as (SubscriptionSelection & { user_id: string })[]) {
      const subscription = fromRow(row);
      if (subscription === null) {
        continue;
      }
      const list = grouped.get(row.user_id) ?? [];
      list.push(subscription);
      grouped.set(row.user_id, list);
    }
  }
  return grouped;
}

export async function POST(request: Request): Promise<Response> {
  const token = bearerToken(request);
  if (token === null || !secretMatches(token, readCronEnv().cronSecret)) {
    return json(401, { error: "unauthorized" });
  }

  const startedAt = Date.now();
  const deadline = startedAt + budgetMs;
  const now = new Date();

  try {
    const receipts = await checkPushReceipts(startedAt + receiptBudgetMs);

    const profiles = await loadProfiles();
    const eligible: { profile: ProfileRow; today: CalendarDate; slot: BatchSlot }[] =
      [];
    for (const profile of profiles) {
      const parts =
        localParts(now, profile.timezone ?? fallbackZone) ??
        localParts(now, fallbackZone);
      if (parts === null) {
        continue;
      }
      const slot = slotFor(profile, parts.hour);
      const anyOn =
        profile.renewal_reminders ||
        profile.trial_reminders ||
        profile.renews_today ||
        profile.monthly_digest;
      const anyChannel = profile.email_enabled || profile.push_enabled;
      if (slot !== null && anyOn && anyChannel) {
        eligible.push({ profile, today: parts.date, slot });
      }
    }

    const emailUsers = eligible.filter((entry) => entry.profile.email_enabled);
    const pushUsers = eligible.filter((entry) => entry.profile.push_enabled);
    const emails = emailUsers.length === 0 ? new Map<string, string>() : await loadEmails();
    const tokens =
      pushUsers.length === 0
        ? new Map<string, string[]>()
        : await loadPushTokens(pushUsers.map((entry) => entry.profile.id));
    const subscriptions =
      eligible.length === 0
        ? new Map<string, Subscription[]>()
        : await loadSubscriptions(eligible.map((entry) => entry.profile.id));

    const planned: Planned[] = [];
    for (const { profile, today, slot } of eligible) {
      const recipient: Recipient = {
        email: emails.get(profile.id) ?? null,
        tokens: tokens.get(profile.id) ?? [],
      };
      const list = subscriptions.get(profile.id) ?? [];
      planned.push(
        ...fanOut(
          profile,
          recipient,
          today,
          slot,
          reminderItems(profile, today, list),
          digestFor(profile, today, list),
        ),
      );
    }

    const admin = supabaseAdmin();
    const sent = { email: 0, push: 0 };
    let failed = 0;
    let truncated = false;
    const releaseErrors: string[] = [];

    const args = (item: Planned, claim: Claim) => ({
      p_user_id: item.userId,
      p_subscription_id: claim.subscriptionId,
      p_kind: claim.kind,
      p_due_on: toDbDate(claim.dueOn),
      p_channel: item.channel,
    });
    const claim = async (item: Planned, entry: Claim): Promise<boolean> => {
      const result = await admin.rpc("claim_notification", args(item, entry));
      if (result.error !== null) {
        throw result.error;
      }
      return result.data === true;
    };
    const release = async (item: Planned, entry: Claim): Promise<void> => {
      const result = await admin.rpc("release_notification", args(item, entry));
      if (result.error !== null) {
        releaseErrors.push(result.error.message);
      }
    };

    for (const item of planned) {
      if (Date.now() > deadline) {
        truncated = true;
        break;
      }
      if (item.gate !== null && !(await claim(item, item.gate))) {
        continue;
      }
      const claimed: Claim[] = [];
      for (const entry of item.claims) {
        if (await claim(item, entry)) {
          claimed.push(entry);
        }
      }
      if (claimed.length === 0) {
        if (item.gate !== null) {
          await release(item, item.gate);
        }
        continue;
      }
      const ok = await item.send(claimed);
      if (ok) {
        sent[item.channel] += 1;
      } else {
        failed += 1;
        for (const entry of claimed) {
          await release(item, entry);
        }
        if (item.gate !== null) {
          await release(item, item.gate);
        }
      }
      if (item.channel === "email") {
        await wait(sendSpacingMs);
      }
    }

    return json(200, {
      checked: profiles.length,
      eligible: eligible.length,
      planned: planned.length,
      emailSent: sent.email,
      pushSent: sent.push,
      failed,
      truncated,
      receipts,
      releaseErrors,
    });
  } catch (error) {
    console.error("[bruno cron] notifications failed", error);
    return json(500, {
      error: "server_error",
      detail: error instanceof Error ? error.message : JSON.stringify(error),
    });
  }
}
