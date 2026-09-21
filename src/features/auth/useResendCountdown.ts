import { useEffect, useState } from "react";

export const resendSeconds = 60;

export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function useResendCountdown() {
  const [endsAt, setEndsAt] = useState(() => Date.now() + resendSeconds * 1000);
  const [remaining, setRemaining] = useState(resendSeconds);

  useEffect(() => {
    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [endsAt]);

  return {
    remaining,
    restart: () => setEndsAt(Date.now() + resendSeconds * 1000),
  };
}
