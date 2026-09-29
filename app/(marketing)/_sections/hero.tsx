import { PressLink } from "@/components/motion/motion-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { heroContent, routes, SECTION_IDS } from "../_data";
import { HeroReceipt } from "../_visuals/hero-receipt";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="flex flex-wrap items-center gap-x-16 gap-y-12 pt-18 pb-24">
      <div className="min-w-0 max-w-140 grow basis-80">
        <h1
          id="hero-title"
          className="m-0 mb-5 text-[2.75rem] leading-[1.05] font-semibold tracking-[-0.03em] text-pretty min-[720px]:text-[4rem]"
        >
          {heroContent.title}
        </h1>
        <p className="m-0 mb-8 max-w-[44ch] text-[1.125rem] leading-7 text-pretty text-text-2">
          {heroContent.body}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <PressLink href={routes.signUp} className={buttonVariants({ size: "lg" })}>
            Get started free
          </PressLink>
          <PressLink href={`#${SECTION_IDS.how}`} className={buttonVariants({ variant: "secondary", size: "lg" })}>
            See how it works
          </PressLink>
        </div>
        <p className="m-0 mt-5 text-footnote text-muted">{heroContent.footnote}</p>
      </div>
      <div className="flex min-w-0 grow basis-80 justify-center">
        <HeroReceipt />
      </div>
    </section>
  );
}
