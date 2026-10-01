import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { GroupArtTile, MomentTile } from "@/components/ui/icon-3d";
import { cn } from "@/lib/utils/cn";
import type { Lead } from "../_lib/view";

export type LeadSize = "sm" | "md";

const box = { sm: "size-7 rounded-sm", md: "size-9 rounded-control" } as const satisfies Record<LeadSize, string>;

export function LeadTile({ lead, size = "md" }: { lead: Lead; size?: LeadSize }) {
  switch (lead.kind) {
    case "person":
      return <Avatar name={lead.person.displayName} tint={lead.person.tint} buddy={lead.person.buddy} size={size === "md" ? "lg" : "sm"} className={size === "sm" ? "size-7" : undefined} />;
    case "group":
      return <GroupArtTile name={lead.group.name} tint={lead.group.tint} art={lead.group.art} size={size === "md" ? "sm" : "xs"} />;
    case "moment":
      return <MomentTile icon={lead.moment} tint={lead.tint} size={size === "md" ? "sm" : "xs"} />;
    case "bill":
      return (
        <span aria-hidden className={cn("grid shrink-0 place-items-center bg-bg text-text-2", box[size])}>
          <Icon name="receipt" size={size === "md" ? 18 : 14} strokeWidth={1.8} />
        </span>
      );
    case "payment":
      return (
        <span aria-hidden data-tint="green" className={cn("grid shrink-0 place-items-center bg-tint-bg text-tint", box[size])}>
          <Icon name="arrow-right" size={size === "md" ? 18 : 14} strokeWidth={1.8} />
        </span>
      );
    case "sparkle":
      return (
        <span aria-hidden className={cn("grid shrink-0 place-items-center bg-brand-tint text-brand", box[size])}>
          <Icon name="sparkle" size={size === "md" ? 16 : 14} />
        </span>
      );
  }
}
