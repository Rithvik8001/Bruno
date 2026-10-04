"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CommandMenu } from "@/components/ui/command-menu";
import { commandIndex } from "@/lib/command/actions";
import type { CommandIndex } from "@/lib/command/queries";
import { useCommandShortcut } from "@/lib/hooks/use-command-shortcut";
import { EASE, T } from "@/lib/motion/tokens";
import { commandCopy } from "../_data";
import { commandItems } from "../_lib/command-items";

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [index, setIndex] = useState<CommandIndex | null>(null);
  const [openedAt, setOpenedAt] = useState(pathname);

  if (open && openedAt !== pathname) setOpen(false);

  useCommandShortcut("k", () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpenedAt(pathname);
    setSession((s) => s + 1);
    setOpen(true);
    commandIndex({})
      .then((result) => {
        if (result.ok) setIndex(result.data);
      })
      .catch(() => undefined);
  });

  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
  }, [open]);

  const items = useMemo(
    () =>
      commandItems(index, (href) => {
        setOpen(false);
        router.push(href);
      }),
    [index, router],
  );

  return (
    <dialog
      ref={ref}
      aria-label={commandCopy.label}
      onCancel={(e) => {
        e.preventDefault();
        setOpen(false);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-text backdrop:bg-text/30 backdrop:backdrop-blur-[2px]"
    >
      <div
        className="flex h-full w-full justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-[15vh]"
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <AnimatePresence
          onExitComplete={() => {
            if (ref.current?.open) ref.current.close();
          }}
        >
          {open && (
            <motion.div
              key={session}
              className="h-fit w-full max-w-120"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98, transition: { duration: T.t1, ease: EASE } }}
              transition={{ duration: T.t2, ease: EASE }}
            >
              <CommandMenu items={items} onClose={() => setOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </dialog>
  );
}
