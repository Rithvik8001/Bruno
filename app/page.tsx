import Link from "next/link";
import { BrunoLockup } from "@/components/brand/bruno-mark";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-app content-center justify-items-start gap-6 px-5">
      <BrunoLockup />
      <h1 className="m-0 text-display text-pretty">Split the bill, not friendships.</h1>
      <Link href="/design-system" className={buttonVariants({ size: "lg" })}>
        Open the design system
      </Link>
    </main>
  );
}
