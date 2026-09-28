"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";

export interface ToastOptions {
  message: string;
  icon?: IconName;
  tint?: Tint;
  action?: { label: string; onAction: () => void };
  duration?: number;
}

export interface ToastViewProps extends Omit<ToastOptions, "duration"> {
  visible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function ToastView({
  message,
  icon = "check",
  tint = "green",
  action,
  visible = true,
  onDismiss,
  className,
}: ToastViewProps) {
  return (
    <div
      className={cn(
        "inline-flex h-13 items-center gap-3 rounded-tile bg-bg pr-2 pl-3 text-small font-medium shadow-float",
        "transition-[opacity,transform] duration-220 ease-standard",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1.5 opacity-0",
        !action && "pr-4",
        className,
      )}
    >
      <span data-tint={tint} className="grid size-7 place-items-center rounded-sm bg-tint-bg text-tint">
        <Icon name={icon} size={16} strokeWidth={2.4} />
      </span>
      <span>{message}</span>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onAction();
            onDismiss?.();
          }}
          className="h-9 cursor-pointer rounded-sm px-3 text-small font-semibold text-brand hover:bg-brand-tint"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = use(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

interface ActiveToast extends ToastOptions {
  id: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ActiveToast | null>(null);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const seq = useRef(0);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setVisible(false);
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      clearTimeout(timer.current);
      seq.current += 1;
      setCurrent({ ...options, id: seq.current });
      setVisible(true);
      timer.current = setTimeout(dismiss, options.duration ?? 4000);
    },
    [dismiss],
  );

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-5"
      >
        {current && (
          <ToastView
            key={current.id}
            {...current}
            visible={visible}
            onDismiss={dismiss}
            className="pointer-events-auto"
          />
        )}
      </div>
    </ToastContext>
  );
}
