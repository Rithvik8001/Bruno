import { pushPayloadSchema, type PushPayload } from "@/lib/push/payload";

declare const self: ServiceWorkerGlobalScope;

const VERSION = "v2";
const SHELL_CACHE = `bruno-shell-${VERSION}`;
const STATIC_CACHE = `bruno-static-${VERSION}`;
const OFFLINE_PATH = "/offline";
const SUBSCRIPTION_API = "/api/push/subscription";
const ICON = "/icons/pwa/icon-192.png";
const BADGE = "/icons/pwa/badge-96.png";
const OPEN_ACTION = "open";
const STATIC_PREFIXES = ["/_next/static/", "/icons/"] as const;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const cacheStatics = !LOCAL_HOSTS.has(self.location.hostname);
const ASSET_PATTERN = /(?:href|src)="(\/_next\/static\/[^"]+)"/g;

function sameOriginPath(raw: unknown): string {
  if (typeof raw !== "string") return "/home";
  try {
    const url = new URL(raw, self.location.origin);
    return url.origin === self.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : "/home";
  } catch {
    return "/home";
  }
}

async function precacheShell(): Promise<void> {
  const shell = await caches.open(SHELL_CACHE);
  const response = await fetch(OFFLINE_PATH, { cache: "no-store" }).catch(
    () => null,
  );
  if (!response?.ok) return;
  const html = await response.clone().text();
  await shell.put(OFFLINE_PATH, response);
  const assets = [
    ...new Set(
      [...html.matchAll(ASSET_PATTERN)]
        .map((match) => match[1])
        .filter((path): path is string => Boolean(path)),
    ),
  ];
  const statics = await caches.open(STATIC_CACHE);
  await Promise.all(
    assets.map((asset) => statics.add(asset).catch(() => undefined)),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell().finally(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function navigate(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch {
    const offline = await caches.match(OFFLINE_PATH, {
      cacheName: SHELL_CACHE,
    });
    return offline ?? Response.error();
  }
}

async function networkFirst(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match(request, { cacheName: STATIC_CACHE })) ?? Response.error();
  }
}

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request, { cacheName: STATIC_CACHE });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const statics = await caches.open(STATIC_CACHE);
    await statics.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(navigate(request));
    return;
  }
  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)))
    event.respondWith(cacheStatics ? cacheFirst(request) : networkFirst(request));
});

function readPayload(event: PushEvent): PushPayload | null {
  try {
    const parsed = pushPayloadSchema.safeParse(event.data?.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  if (!payload) return;
  const options: NotificationOptions & { actions?: { action: string; title: string }[]; renotify?: boolean } = {
    body: payload.body,
    icon: ICON,
    badge: BADGE,
    tag: payload.tag,
    renotify: true,
    data: { url: sameOriginPath(payload.url) },
    ...(payload.action ? { actions: [{ action: OPEN_ACTION, title: payload.action }] } : {}),
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

async function openPath(path: string): Promise<void> {
  const target = new URL(path, self.location.origin).href;
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  const open = windows.find(
    (client) => new URL(client.url).origin === self.location.origin,
  );
  if (open) {
    const focused = await open.focus();
    await focused.navigate(target).catch(() => self.clients.openWindow(target));
    return;
  }
  await self.clients.openWindow(target);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data: unknown = event.notification.data;
  const url =
    typeof data === "object" && data !== null && "url" in data
      ? data.url
      : null;
  event.waitUntil(openPath(sameOriginPath(url)));
});

interface SubscriptionChangeEvent extends ExtendableEvent {
  readonly oldSubscription: PushSubscription | null;
  readonly newSubscription: PushSubscription | null;
}

async function resubscribe(event: SubscriptionChangeEvent): Promise<void> {
  const previous = event.oldSubscription;
  const key = previous?.options.applicationServerKey;
  const next =
    event.newSubscription ??
    (key
      ? await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        })
      : null);
  if (!next) return;
  await fetch(SUBSCRIPTION_API, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      oldEndpoint: previous?.endpoint ?? null,
      subscription: next.toJSON(),
    }),
  });
}

self.addEventListener("pushsubscriptionchange", (event) => {
  const change = event as SubscriptionChangeEvent;
  change.waitUntil(resubscribe(change));
});
