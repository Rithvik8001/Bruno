import type { IconName } from "@/components/icons/icon";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";
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
} as const;

export interface ComingSoonContent {
  readonly title: string;
  readonly body: string;
  readonly moment: MomentIconId;
  readonly tint: PaletteTint;
}
