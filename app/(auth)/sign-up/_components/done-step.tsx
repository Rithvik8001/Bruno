import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/auth/rules";
import { signUpCopy } from "../_data";

export function DoneStep() {
  return (
    <div className="grid animate-rise justify-items-center gap-5">
      <span data-tint="green" className="grid size-14 place-items-center rounded-[18px] bg-tint-bg text-tint">
        <Icon name="check" size={28} strokeWidth={2.2} />
      </span>
      <Link href={routes.app} className={buttonVariants({ size: "lg", fullWidth: true })}>
        {signUpCopy.done.cta}
      </Link>
    </div>
  );
}
