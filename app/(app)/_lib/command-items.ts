import type { CommandItem } from "@/components/ui/command-menu";
import { routes } from "@/lib/auth/rules";
import type { CommandIndex } from "@/lib/command/queries";
import { commandCopy } from "../_data";

export function commandItems(index: CommandIndex | null, go: (href: string) => void): CommandItem[] {
  const { groups: label } = commandCopy;
  const fixed: CommandItem[] = [
    { id: "add", label: commandCopy.addBill, group: label.actions, icon: "plus", tint: "violet", keywords: ["new", "receipt", "scan"], onSelect: () => go(routes.newBill) },
    { id: "ask", label: commandCopy.ask, group: label.actions, icon: "sparkle", tint: "brand", keywords: ["question", "owe"], onSelect: () => go(routes.ask) },
    { id: "home", label: commandCopy.home, group: label.go, icon: "home", tint: "neutral", onSelect: () => go(routes.app) },
    { id: "groups", label: commandCopy.groupsPage, group: label.go, icon: "users", tint: "neutral", onSelect: () => go(routes.groups) },
    { id: "activity", label: commandCopy.activity, group: label.go, icon: "activity", tint: "neutral", onSelect: () => go(routes.activity) },
    { id: "settings", label: commandCopy.settings, group: label.go, icon: "settings", tint: "neutral", keywords: ["profile", "export", "theme"], onSelect: () => go(routes.settings) },
  ];
  if (!index) return fixed;
  const groups = index.groups.map<CommandItem>((g) => ({
    id: `group-${g.id}`,
    label: g.name,
    group: label.groups,
    icon: "users",
    tint: g.tint,
    onSelect: () => go(routes.group(g.id)),
  }));
  const people = index.people.map<CommandItem>((p) => ({
    id: `person-${p.id}`,
    label: p.name,
    group: label.people,
    icon: "user",
    tint: p.tint,
    keywords: ["settle", "balance"],
    onSelect: () => go(routes.groupTab(p.groupId, "balances")),
  }));
  return [...fixed, ...groups, ...people];
}
