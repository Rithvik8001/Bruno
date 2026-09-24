import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { compareDates, today, type CalendarDate } from "@/lib/calendar";

function untilTomorrow(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

export function useToday(): CalendarDate {
  const [day, setDay] = useState(() => today());

  useEffect(() => {
    const sync = () => {
      const next = today();
      setDay((previous) =>
        compareDates(previous, next) === 0 ? previous : next,
      );
    };
    let timer = setTimeout(function tick() {
      sync();
      timer = setTimeout(tick, untilTomorrow());
    }, untilTomorrow());
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        sync();
      }
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return day;
}
