import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { MomentTile } from "@/components/ui/icon-3d";
import { newBillCopy } from "../_data";

export interface TellBrunoCardProps {
  href: string;
  locked: boolean;
}

export function TellBrunoCard({ href, locked }: TellBrunoCardProps) {
  const copy = newBillCopy.entry.tellBruno;
  if (locked) {
    return (
      <div
        aria-disabled="true"
        className="grid cursor-not-allowed grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-card border border-dashed border-border px-4 py-3.5 text-text-2"
      >
        <span className="grid size-11 place-items-center rounded-tile bg-surface-2 text-muted">
          <Icon name="sparkle" size={22} />
        </span>
        <span className="grid">
          <span className="font-semibold">{copy.title}</span>
          <span className="text-small">{copy.locked}</span>
        </span>
        <Icon name="lock" size={18} className="text-muted" />
      </div>
    );
  }
  return (
    <PressLink
      href={href}
      wide
      className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-card bg-surface px-4 py-3.5 text-text no-underline transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-text"
    >
      <MomentTile icon="sparkles" tint="pink" size="md" />
      <span className="grid">
        <span className="font-semibold">{copy.title}</span>
        <span className="text-small text-text-2">{copy.body}</span>
      </span>
      <Icon name="chevron-right" size={18} className="text-muted" />
    </PressLink>
  );
}
