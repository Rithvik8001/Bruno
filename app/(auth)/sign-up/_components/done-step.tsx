import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { buttonVariants } from "@/components/ui/button";
import { signUpCopy } from "../_data";

export function DoneStep({ href }: { href: string }) {
  return (
    <div className="grid animate-rise justify-items-center gap-5">
      <span data-tint="green" className="grid size-14 place-items-center rounded-[18px] bg-tint-bg text-tint">
        <Icon name="check" size={28} strokeWidth={2.2} />
      </span>
      <Link href={href} className={buttonVariants({ size: "lg", fullWidth: true })}>
        {signUpCopy.done.cta}
      </Link>
    </div>
  );
}
