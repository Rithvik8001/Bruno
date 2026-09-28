import type { ReactNode } from "react";

interface IconDefinition {
  readonly filled?: boolean;
  readonly node: ReactNode;
}

export const iconRegistry = {
  plus: { node: <path d="M12 5v14M5 12h14" /> },
  minus: { node: <path d="M5 12h14" /> },
  check: { node: <path d="M5 12l5 5L20 7" /> },
  close: { node: <path d="M6 6l12 12M18 6L6 18" /> },
  "chevron-left": { node: <path d="M15 5l-7 7 7 7" /> },
  "chevron-down": { node: <path d="M6 9l6 6 6-6" /> },
  search: {
    node: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4 4" />
      </>
    ),
  },
  calendar: {
    node: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M4 10h16M8 3v4M16 3v4" />
      </>
    ),
  },
  clock: {
    node: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  timer: { node: <path d="M12 6a7 7 0 100 14 7 7 0 000-14zM12 10v3l2 1M9 3h6" /> },
  flame: {
    node: <path d="M12 3c1 3 4 5 4 9a4 4 0 01-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z" />,
  },
  "check-circle": {
    node: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.5 2.5L16 9.5" />
      </>
    ),
  },
  "pause-circle": {
    node: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM10 9v6M14 9v6" />,
  },
  alert: {
    node: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16.5v.5" />
      </>
    ),
  },
  receipt: {
    node: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  },
  document: { node: <path d="M6 3h12v18H6zM9 8h6M9 12h4" /> },
  user: { node: <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM4 21c0-4 3.6-7 8-7s8 3 8 7" /> },
  users: {
    node: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M16 5a3.5 3.5 0 010 7M21 20c0-2.6-1.7-4.8-4-5.6" />
      </>
    ),
  },
  wallet: { node: <path d="M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2" /> },
  more: {
    filled: true,
    node: (
      <>
        <circle cx="6" cy="12" r="1.6" />
        <circle cx="12" cy="12" r="1.6" />
        <circle cx="18" cy="12" r="1.6" />
      </>
    ),
  },
  sparkle: {
    filled: true,
    node: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />,
  },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof iconRegistry;
