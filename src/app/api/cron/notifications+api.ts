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
import type { DigestEmail, DigestRow, RenewalEmail } from "@/server/emails/types";
import { readCronEnv } from "@/server/env";
import { bearerToken, json, secretMatches } from "@/server/http";
import {
  deliverMonthlyDigest,
  deliverRenewalReminder,
  deliverRenewsToday,
  deliverTrialReminder,
} from "@/server/mailer";
import { supabaseAdmin } from "@/server/supabaseAdmin";

const sendHour = 9;
const pageSize = 1000;
const userChunk = 200;
const sendSpacingMs = 550;
const budgetMs = 50_000;
const digestCategories = 3;
const maxDigestCharges = 40;
const fallbackZone = "UTC";

type Kind = "renewal" | "trial" | "renews_today" | "digest";

type ProfileRow = {
  id: string;
  currency: string;
  timezone: string | null;
  renewal_reminders: boolean;
  trial_reminders: boolean;
  renews_today: boolean;
  monthly_digest: boolean;
  reminder_lead_days: number;
};

type Planned = {
  userId: string;
  email: string;
  kind: Kind;
  subscriptionId: string | null;
  dueOn: CalendarDate;
  send: () => Promise<boolean>;
};

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

function plan(
  profile: ProfileRow,
  email: string,
  today: CalendarDate,
  subscriptions: readonly Subscription[],
): Planned[] {
  const planned: Planned[] = [];
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
      planned.push({
        userId: profile.id,
        email,
        kind: "renews_today",
        subscriptionId: subscription.id,
        dueOn: renewal,
        send: () => deliverRenewsToday(email, subscription.id, input),
      });
    }
    if (days === lead) {
      const endsTrial =
        subscription.trialEndsOn !== null &&
        isInTrial(subscription.trialEndsOn, today) &&
        compareDates(renewal, subscription.trialEndsOn) === 0;
      if (endsTrial && profile.trial_reminders) {
        planned.push({
          userId: profile.id,
          email,
          kind: "trial",
          subscriptionId: subscription.id,
          dueOn: renewal,
          send: () => deliverTrialReminder(email, subscription.id, input),
        });
      } else if (!endsTrial && profile.renewal_reminders) {
        planned.push({
          userId: profile.id,
          email,
          kind: "renewal",
          subscriptionId: subscription.id,
          dueOn: renewal,
          send: () => deliverRenewalReminder(email, subscription.id, input),
        });
      }
    }
  }

  if (today.day === 1 && profile.monthly_digest) {
    const input = digestInput(subscriptions, today, profile.currency);
    planned.push({
      userId: profile.id,
      email,
      kind: "digest",
      subscriptionId: null,
      dueOn: today,
      send: () => deliverMonthlyDigest(email, profile.id, input),
    });
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
        "id, currency, timezone, renewal_reminders, trial_reminders, renews_today, monthly_digest, reminder_lead_days",
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
    const profiles = await loadProfiles();
    const eligible: { profile: ProfileRow; today: CalendarDate }[] = [];
    for (const profile of profiles) {
      const parts =
        localParts(now, profile.timezone ?? fallbackZone) ??
        localParts(now, fallbackZone);
      if (parts === null || parts.hour < sendHour) {
        continue;
      }
      const anyOn =
        profile.renewal_reminders ||
        profile.trial_reminders ||
        profile.renews_today ||
        profile.monthly_digest;
      if (anyOn) {
        eligible.push({ profile, today: parts.date });
      }
    }

    const emails = eligible.length === 0 ? new Map() : await loadEmails();
    const subscriptions =
      eligible.length === 0
        ? new Map<string, Subscription[]>()
        : await loadSubscriptions(eligible.map((entry) => entry.profile.id));

    const planned: Planned[] = [];
    for (const { profile, today } of eligible) {
      const email = emails.get(profile.id);
      if (email === undefined) {
        continue;
      }
      planned.push(
        ...plan(profile, email, today, subscriptions.get(profile.id) ?? []),
      );
    }

    const admin = supabaseAdmin();
    let sent = 0;
    let failed = 0;
    let truncated = false;
    const releaseErrors: string[] = [];

    for (const item of planned) {
      if (Date.now() > deadline) {
        truncated = true;
        break;
      }
      const args = {
        p_user_id: item.userId,
        p_subscription_id: item.subscriptionId,
        p_kind: item.kind,
        p_due_on: toDbDate(item.dueOn),
      };
      const claim = await admin.rpc("claim_notification", args);
      if (claim.error !== null) {
        throw claim.error;
      }
      if (claim.data !== true) {
        continue;
      }
      const ok = await item.send();
      if (ok) {
        sent += 1;
      } else {
        failed += 1;
        const released = await admin.rpc("release_notification", args);
        if (released.error !== null) {
          releaseErrors.push(released.error.message);
        }
      }
      await wait(sendSpacingMs);
    }

    return json(200, {
      checked: profiles.length,
      eligible: eligible.length,
      planned: planned.length,
      sent,
      failed,
      truncated,
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
