import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { buddyShapeFor } from "@/lib/design-system/buddies";
import { welcomeCopy } from "./_data";
import { OnboardingFlow } from "./_components/onboarding-flow";

export const metadata: Metadata = { title: welcomeCopy.metaTitle };

export default async function WelcomePage() {
  const { person } = await requireAppContext(routes.welcome);
  if (person.onboarded) redirect(routes.app);
  return <OnboardingFlow person={person} defaultBuddy={buddyShapeFor(person.displayName)} />;
}
