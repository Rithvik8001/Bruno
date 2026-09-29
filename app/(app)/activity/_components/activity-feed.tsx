"use client";

import { useState, useTransition } from "react";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Button } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import type { PersonId } from "@/lib/domain/ids";
import { loadEarlierActivity } from "@/lib/feed/actions";
import { groupByDay } from "@/lib/feed/days";
import type { FeedFilter, FeedItem, FeedPage } from "@/lib/feed/types";
import { activityCopy } from "../_data";
import { ActivityRow } from "./activity-row";

export interface ActivityFeedProps {
  filter: FeedFilter;
  initial: FeedPage;
  you: PersonId;
  now: Date;
}

export function ActivityFeed({ filter, initial, you, now }: ActivityFeedProps) {
  const [items, setItems] = useState<readonly FeedItem[]>(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  const loadEarlier = () => {
    if (!cursor) return;
    startTransition(async () => {
      const result = await loadEarlierActivity({ filter, cursor });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setError(null);
      setItems((current) => [...current, ...result.data.items]);
      setCursor(result.data.nextCursor);
    });
  };

  return (
    <div className="grid gap-7">
      <Stagger className="grid gap-7">
        {groupByDay(items, now).map((day) => (
          <StaggerItem key={day.label} className="grid gap-1.5">
            <h2 className="m-0 px-1 text-footnote font-semibold text-muted">{day.label}</h2>
            <div className="grid">
              {day.items.map((item) => (
                <ActivityRow key={item.id} item={item} you={you} />
              ))}
            </div>
          </StaggerItem>
        ))}
      </Stagger>
      {error && <InlineAlert>{error}</InlineAlert>}
      {cursor && (
        <Button
          variant="secondary"
          size="lg"
          loading={loading}
          onClick={loadEarlier}
          className="justify-self-center text-small text-text-2"
        >
          {activityCopy.earlier}
        </Button>
      )}
    </div>
  );
}
