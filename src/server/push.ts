import { readPushEnv } from "./env";
import { supabaseAdmin } from "./supabaseAdmin";

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data: { url: string };
  sound: "default";
  threadId: string;
  collapseId: string;
  ttl: number;
};

type Failure = {
  error?: string;
  apns?: { reason?: string };
};

type Ticket =
  | { status: "ok"; id: string }
  | { status: "error"; message?: string; details?: Failure };

type Receipt = { status: "ok" | "error"; details?: Failure };

const sendUrl = "https://exp.host/--/api/v2/push/send";
const receiptsUrl = "https://exp.host/--/api/v2/push/getReceipts";
const chunkSize = 100;
const receiptBatch = 1000;
const receiptDelayMs = 15 * 60_000;
const receiptMaxAgeMs = 24 * 3_600_000;
const deadErrors = ["DeviceNotRegistered"];
const deadReasons = ["BadDeviceToken", "Unregistered", "DeviceTokenNotForTopic"];

function isDead(details: Failure | undefined): boolean {
  return (
    details !== undefined &&
    ((details.error !== undefined && deadErrors.includes(details.error)) ||
      (details.apns?.reason !== undefined &&
        deadReasons.includes(details.apns.reason)))
  );
}

export const pushTtlSeconds = 12 * 3600;

function headers(): Record<string, string> {
  const base: Record<string, string> = {
    accept: "application/json",
    "accept-encoding": "gzip, deflate",
    "content-type": "application/json",
  };
  const { accessToken } = readPushEnv();
  if (accessToken !== null) {
    base.authorization = `Bearer ${accessToken}`;
  }
  return base;
}

async function post(url: string, body: unknown): Promise<unknown> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error("[bruno push] request failed", url, response.status);
      return null;
    }
    return (await response.json()) as unknown;
  } catch (error) {
    console.error("[bruno push] request threw", url, error);
    return null;
  }
}

function isTicket(value: unknown): value is Ticket {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    (value.status === "ok" || value.status === "error")
  );
}

function readTickets(payload: unknown): Ticket[] | null {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    return null;
  }
  const data = payload.data;
  return Array.isArray(data) && data.every(isTicket) ? data : null;
}

function readReceipts(payload: unknown): Map<string, Receipt> {
  const receipts = new Map<string, Receipt>();
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    return receipts;
  }
  const data = payload.data;
  if (typeof data !== "object" || data === null) {
    return receipts;
  }
  for (const [id, receipt] of Object.entries(data)) {
    if (isTicket(receipt)) {
      receipts.set(id, receipt as Receipt);
    }
  }
  return receipts;
}

async function pruneTokens(tokens: readonly string[]): Promise<number> {
  if (tokens.length === 0) {
    return 0;
  }
  const { error, count } = await supabaseAdmin()
    .from("push_tokens")
    .delete({ count: "exact" })
    .in("token", tokens);
  if (error !== null) {
    console.error("[bruno push] prune failed", error.message);
    return 0;
  }
  return count ?? 0;
}

export type PushOutcome = {
  delivered: boolean;
  receipts: { ticket_id: string; token: string }[];
  dead: string[];
};

export async function sendPushMessages(
  messages: readonly PushMessage[],
): Promise<PushOutcome> {
  const outcome: PushOutcome = { delivered: false, receipts: [], dead: [] };

  for (let start = 0; start < messages.length; start += chunkSize) {
    const chunk = messages.slice(start, start + chunkSize);
    const tickets = readTickets(await post(sendUrl, chunk));
    if (tickets === null) {
      continue;
    }
    tickets.forEach((ticket, index) => {
      const token = chunk[index]?.to;
      if (token === undefined) {
        return;
      }
      if (ticket.status === "ok") {
        outcome.delivered = true;
        outcome.receipts.push({ ticket_id: ticket.id, token });
      } else if (isDead(ticket.details)) {
        outcome.dead.push(token);
      } else {
        console.error(
          "[bruno push] ticket error",
          ticket.details?.error,
          ticket.message,
        );
      }
    });
  }
  return outcome;
}

export async function settlePushOutcomes(
  outcomes: readonly PushOutcome[],
): Promise<void> {
  const dead = outcomes.flatMap((outcome) => outcome.dead);
  const receipts = outcomes.flatMap((outcome) => outcome.receipts);
  await pruneTokens(dead);
  if (receipts.length > 0) {
    const { error } = await supabaseAdmin()
      .from("push_receipts")
      .upsert(receipts, { onConflict: "ticket_id", ignoreDuplicates: true });
    if (error !== null) {
      console.error("[bruno push] receipt store failed", error.message);
    }
  }
}

export async function checkPushReceipts(
  deadline: number,
): Promise<{ checked: number; pruned: number }> {
  const result = { checked: 0, pruned: 0 };
  try {
    const admin = supabaseAdmin();
    const now = Date.now();
    await admin
      .from("push_receipts")
      .delete()
      .lt("created_at", new Date(now - receiptMaxAgeMs).toISOString());

    const { data, error } = await admin
      .from("push_receipts")
      .select("ticket_id, token")
      .lt("created_at", new Date(now - receiptDelayMs).toISOString())
      .order("created_at")
      .limit(receiptBatch);
    if (error !== null || data.length === 0 || Date.now() > deadline) {
      return result;
    }

    const rows = data as { ticket_id: string; token: string }[];
    const receipts = readReceipts(
      await post(receiptsUrl, { ids: rows.map((row) => row.ticket_id) }),
    );
    const dead: string[] = [];
    const answered: string[] = [];
    for (const row of rows) {
      const receipt = receipts.get(row.ticket_id);
      if (receipt === undefined) {
        continue;
      }
      answered.push(row.ticket_id);
      if (receipt.status === "error" && isDead(receipt.details)) {
        dead.push(row.token);
      }
    }
    result.checked = answered.length;
    result.pruned = await pruneTokens(dead);
    if (answered.length > 0) {
      await admin.from("push_receipts").delete().in("ticket_id", answered);
    }
  } catch (error) {
    console.error("[bruno push] receipt check failed", error);
  }
  return result;
}
