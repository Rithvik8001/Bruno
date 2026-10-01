import type { Metadata } from "next";
import { SECTION_IDS, stories } from "./_data";
import { Frame } from "./_components/primitives";
import { Faq } from "./_sections/faq";
import { Groups } from "./_sections/groups";
import { Hero } from "./_sections/hero";
import { Pricing } from "./_sections/pricing";
import { SiteFooter } from "./_sections/site-footer";
import { SiteNav } from "./_sections/site-nav";
import { Story } from "./_sections/story";
import { AskVisual } from "./_visuals/ask-visual";
import { BalanceVisual } from "./_visuals/balance-visual";
import { ClaimVisual } from "./_visuals/claim-visual";
import { NoticesVisual } from "./_visuals/notices-visual";
import { SayVisual } from "./_visuals/say-visual";
import { ScanVisual } from "./_visuals/scan-visual";
import { SettleVisual } from "./_visuals/settle-visual";

export const metadata: Metadata = {
  title: { absolute: "Bruno — Split the bill, not friendships" },
  description:
    "Scan the receipt or just say what happened. Friends tap what they had. Bruno works out who owes whom — one number each.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <SiteNav />
      <Frame id="top" className="scroll-mt-16">
        <main>
          <Hero />
          <div id={SECTION_IDS.how} className="scroll-mt-16">
            <Story
              id="upload"
              content={stories.upload}
              visual={<ScanVisual />}
            />
            <Story
              id="say"
              content={stories.say}
              visual={<SayVisual />}
              flip
            />
            <Story
              id="claim"
              content={stories.claim}
              visual={<ClaimVisual />}
            />
            <Story
              id="balance"
              content={stories.balance}
              visual={<BalanceVisual />}
              flip
            />
            <Story
              id="ask"
              content={stories.ask}
              visual={<AskVisual />}
            />
            <Story
              id="notices"
              content={stories.notices}
              visual={<NoticesVisual />}
              flip
            />
            <Story
              id="settle"
              content={stories.settle}
              visual={<SettleVisual />}
            />
          </div>
          <Groups />
          <Pricing />
          <Faq />
        </main>
      </Frame>
      <SiteFooter />
    </div>
  );
}
