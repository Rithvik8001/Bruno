import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReduceTransparency(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (active) {
        setReduced(value);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduced,
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) {
        setReduced(value);
      }
    });

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
