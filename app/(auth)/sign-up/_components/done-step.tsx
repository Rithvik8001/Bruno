"use client";

import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { PressLink } from "@/components/motion/motion-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { useCelebrateOnMount } from "../../_lib/use-celebrate";
import { signUpCopy } from "../_data";

export function DoneStep({ href }: { href: string }) {
  const celebrate = useCelebrateOnMount<HTMLSpanElement>();
  return (
    <div className="grid justify-items-center gap-5">
      <span
        ref={celebrate}
        data-tint="green"
        className="grid size-14 place-items-center rounded-[18px] bg-tint-bg text-tint"
      >
        <CheckIn className="grid place-items-center" transition={{ delay: 0.12 }}>
          <Icon name="check" size={28} strokeWidth={2.2} />
        </CheckIn>
      </span>
      <PressLink wide href={href} className={buttonVariants({ size: "lg", fullWidth: true })}>
        {signUpCopy.done.cta}
      </PressLink>
    </div>
  );
}
