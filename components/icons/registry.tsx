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
  "chevron-right": { node: <path d="M9 6l6 6-6 6" /> },
  "arrow-right": { node: <path d="M5 12h14M13 6l6 6-6 6" /> },
  "align-left": { node: <path d="M4 7h16M4 12h10M4 17h6" /> },
  bell: { node: <path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0" /> },
  split: { node: <path d="M12 4v16M5 8l-2 4 2 4M19 8l2 4-2 4" /> },
  "person-outline": {
    node: (
      <>
        <circle cx="12" cy="9" r="3.5" />
        <path d="M5.5 19.5c1.2-3 3.7-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
      </>
    ),
  },
  pencil: { node: <path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" /> },
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
  download: { node: <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /> },
  file: { node: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" /> },
  grid: {
    node: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="2" />
        <rect x="13" y="4" width="7" height="7" rx="2" />
        <rect x="4" y="13" width="7" height="7" rx="2" />
        <rect x="13" y="13" width="7" height="7" rx="2" />
      </>
    ),
  },
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
  upload: {
    node: (
      <>
        <path d="M12 15V4M7 9l5-5 5 5" />
        <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
      </>
    ),
  },
  copy: {
    node: (
      <>
        <rect x="8" y="3" width="13" height="13" rx="2.5" />
        <path d="M16 16v2.5A2.5 2.5 0 0113.5 21h-8A2.5 2.5 0 013 18.5v-8A2.5 2.5 0 015.5 8H8" />
      </>
    ),
  },
  eye: {
    node: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  "eye-off": {
    node: (
      <path d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M6.5 6.7C3.8 8.4 2 12 2 12s3.5 6 10 6c1.6 0 3-.3 4.3-.9M9.9 6.2C10.6 6.1 11.3 6 12 6c6.5 0 10 6 10 6s-.9 1.5-2.4 3" />
    ),
  },
  contrast: {
    node: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4v16a8 8 0 000-16z" fill="currentColor" stroke="none" />
      </>
    ),
  },
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
  home: {
    node: (
      <>
        <path d="M4 11l8-7 8 7v9H4z" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
  },
  activity: { node: <path d="M3 12h3.5l3-7 4 14 3-7H21" /> },
  link: {
    node: (
      <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
    ),
  },
  settings: {
    node: (
      <>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </>
    ),
  },
  card: {
    node: (
      <>
        <rect x="3" y="5.5" width="18" height="13" rx="3" />
        <path d="M3 10h18M7 15h3" />
      </>
    ),
  },
  mail: {
    node: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 8l9 6 9-6" />
      </>
    ),
  },
  lock: {
    node: (
      <>
        <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
        <path d="M8 10.5V7.5a4 4 0 018 0v3M12 14.5v2" />
      </>
    ),
  },
  keypad: {
    node: (
      <>
        <rect x="2.5" y="7" width="19" height="10" rx="3" />
        <path d="M7 12h.01M12 12h.01M17 12h.01" strokeWidth={3} />
      </>
    ),
  },
  device: {
    node: (
      <>
        <rect x="6" y="2.5" width="12" height="19" rx="3" />
        <path d="M11 18.5h2" />
      </>
    ),
  },
  mic: {
    node: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" />
      </>
    ),
  },
  "mic-off": {
    node: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M4 4l16 16" />
      </>
    ),
  },
  quote: {
    filled: true,
    node: <path d="M4 18v-5c0-3.5 1.6-6 5-7l.8 1.6C8 8.4 7.2 9.7 7 11h3v7H4zm10 0v-5c0-3.5 1.6-6 5-7l.8 1.6c-1.8.8-2.6 2.1-2.8 3.4h3v7h-6z" />,
  },
  lines: { node: <path d="M7 7h10M7 12h10M7 17h6" /> },
  swap: { node: <path d="M7 7h13l-3-3M17 17H4l3 3" /> },
  reply: { node: <path d="M9 5v6a4 4 0 004 4h7M16 11l4 4-4 4" /> },
  "chevron-up": { node: <path d="M6 15l6-6 6 6" /> },
  exit: { node: <path d="M14 4H6.5v16H14M10.5 12H20M16.5 8.5L20 12l-3.5 3.5" /> },
  trash: { node: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /> },
  refresh: { node: <path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" /> },
  undo: { node: <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" /> },
  "check-square": { node: <path d="M4 4h16v16H4zM8 12l3 3 5-6" /> },
  sparkle: {
    filled: true,
    node: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />,
  },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof iconRegistry;
