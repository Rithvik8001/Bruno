import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo } from "react-native";

type AccessibilityValue = {
  reduceMotion: boolean;
  reduceTransparency: boolean;
};

const readReduceMotion = () => AccessibilityInfo.isReduceMotionEnabled();
const readReduceTransparency = () =>
  AccessibilityInfo.isReduceTransparencyEnabled();

const AccessibilityContext = createContext<AccessibilityValue>({
  reduceMotion: false,
  reduceTransparency: false,
});

function useSetting(
  read: () => Promise<boolean>,
  event: "reduceMotionChanged" | "reduceTransparencyChanged",
): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    read().then((value) => {
      if (active) {
        setEnabled(value);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(event, setEnabled);

    return () => {
      active = false;
      subscription.remove();
    };
  }, [read, event]);

  return enabled;
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useSetting(readReduceMotion, "reduceMotionChanged");
  const reduceTransparency = useSetting(
    readReduceTransparency,
    "reduceTransparencyChanged",
  );

  return (
    <AccessibilityContext value={{ reduceMotion, reduceTransparency }}>
      {children}
    </AccessibilityContext>
  );
}

export function useReduceTransparency(): boolean {
  return use(AccessibilityContext).reduceTransparency;
}

export function useReduceMotion(): boolean {
  return use(AccessibilityContext).reduceMotion;
}
