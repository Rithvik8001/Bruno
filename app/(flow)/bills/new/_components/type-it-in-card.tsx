import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { MomentTile } from "@/components/ui/icon-3d";
import { newBillCopy } from "../_data";

export function TypeItInCard({ href }: { href: string }) {
  const copy = newBillCopy.entry.typeItIn;
  return (
    <Link
      href={href}
      className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-card bg-surface px-4 py-3.5 text-text no-underline transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-text"
    >
      <MomentTile icon="memo" tint="cyan" size="md" />
      <span className="grid">
        <span className="font-semibold">{copy.title}</span>
        <span className="text-small text-text-2">{copy.body}</span>
      </span>
      <Icon name="chevron-right" size={18} className="text-muted" />
    </Link>
  );
}
