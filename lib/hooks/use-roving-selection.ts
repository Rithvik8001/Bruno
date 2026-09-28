"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";

export function useRovingSelection<T extends string>(
  values: readonly T[],
  value: T,
  onChange: (next: T) => void,
) {
  const refs = useRef(new Map<T, HTMLElement>());

  const register = useCallback(
    (v: T) => (el: HTMLElement | null) => {
      if (el) refs.current.set(v, el);
      else refs.current.delete(v);
    },
    [],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const i = values.indexOf(value);
      const last = values.length - 1;
      let next: number;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          next = i >= last ? 0 : i + 1;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          next = i <= 0 ? last : i - 1;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = last;
          break;
        default:
          return;
      }
      e.preventDefault();
      const v = values[next];
      if (v === undefined) return;
      onChange(v);
      refs.current.get(v)?.focus();
    },
    [values, value, onChange],
  );

  return { register, onKeyDown };
}
