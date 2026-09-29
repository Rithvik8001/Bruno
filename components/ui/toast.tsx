"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EASE, SPRING } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

const DEFAULT_MS = 2800;
const WITH_ACTION_MS = 6000;
const MAX_VISIBLE = 2;

export interface ToastAction {
  label: string;
  onAction: () => void;
}

export interface ToastOptions {
  message: string;
  action?: ToastAction;
  duration?: number;
}

export interface ToastViewProps extends Omit<ToastOptions, "duration"> {
  onDismiss?: () => void;
  className?: string;
}

export function ToastView({ message, action, onDismiss, className }: ToastViewProps) {
  return (
    <div
      className={cn(
        "flex min-h-11 max-w-105 items-center gap-3.5 rounded-[14px] bg-text py-2.5 pr-2.5 pl-4 text-small font-medium text-bg shadow-[0_8px_28px_rgba(0,0,0,.18)]",
        !action && "pr-4",
        className,
      )}
    >
      <span className="min-w-0 flex-1 pr-1.5">{message}</span>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onAction();
            onDismiss?.();
          }}
          className="h-7.5 cursor-pointer rounded-sm border-0 bg-transparent px-2.5 text-footnote font-semibold text-brand-tint"
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
  const [toasts, setToasts] = useState<readonly ActiveToast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    setToasts([]);
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      seq.current += 1;
      const id = seq.current;
      setToasts((list) => [...list, { ...options, id }].slice(-MAX_VISIBLE));
      timers.current.set(
        id,
        setTimeout(() => remove(id), options.duration ?? (options.action ? WITH_ACTION_MS : DEFAULT_MS)),
      );
    },
    [remove],
  );

  useEffect(() => {
    if (toasts.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toasts.length, dismiss]);

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(112px+env(safe-area-inset-bottom))] z-[1000] grid justify-items-center gap-2 px-4 nav:bottom-8"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.2, ease: EASE } }}
              transition={SPRING}
              className="pointer-events-auto"
            >
              <ToastView message={t.message} action={t.action} onDismiss={() => remove(t.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}
