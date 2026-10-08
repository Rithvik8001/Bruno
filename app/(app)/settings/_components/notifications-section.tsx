"use client";

import { useState } from "react";
import { PushRow } from "@/components/pwa/push-row";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { setNotificationPref } from "@/lib/notifications/actions";
import { NOTIFICATION_CATEGORIES, type NotificationCategory, type NotificationPrefs } from "@/lib/notifications/kinds";
import { settingsCopy } from "../_data";

export function NotificationsSection({ initial }: { initial: NotificationPrefs }) {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState(initial);
  const copy = settingsCopy.notifications;

  const toggle = async (category: NotificationCategory, enabled: boolean) => {
    setPrefs((current) => ({ ...current, [category]: enabled }));
    const result = await setNotificationPref({ category, enabled }).catch(() => null);
    if (result?.ok) return;
    setPrefs((current) => ({ ...current, [category]: !enabled }));
    toast({ message: result?.error.message ?? copy.failed });
  };

  return (
    <>
      <PushRow />
      {NOTIFICATION_CATEGORIES.map((category) => (
        <Switch
          key={category}
          checked={prefs[category]}
          onCheckedChange={(enabled) => void toggle(category, enabled)}
          className="min-h-15 py-2"
        >
          <span className="grid gap-0.5">
            <span className="font-medium">{copy.rows[category].label}</span>
            <span className="text-footnote text-text-2">{copy.rows[category].sub}</span>
          </span>
        </Switch>
      ))}
    </>
  );
}
