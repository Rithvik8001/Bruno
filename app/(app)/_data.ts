import type { IconName } from "@/components/icons/icon";
import { routes } from "@/lib/auth/rules";

export interface AppNavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: IconName;
}

export const appNav = [
  { href: routes.app, label: "Home", icon: "home" },
  { href: routes.groups, label: "Groups", icon: "users" },
  { href: routes.activity, label: "Activity", icon: "activity" },
] as const satisfies readonly AppNavItem[];

export const shellCopy = {
  brand: "Bruno",
  homeLabel: "Bruno home",
  addBill: "Add a bill",
  settings: "Settings",
  mainNav: "Main",
  unread: "New activity",
} as const;
