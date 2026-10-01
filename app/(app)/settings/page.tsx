import type { Metadata } from "next";
import { getDeleteStatus } from "@/lib/account/queries";
import { getAllowance } from "@/lib/ai/allowance";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { localDay } from "@/lib/dates";
import { buddyShapeFor } from "@/lib/design-system/buddies";
import { exportGroups } from "@/lib/export/load";
import { getDefaultCurrency } from "@/lib/people/person";
import { getNotificationPrefs } from "@/lib/notifications/prefs";
import { cookieTimeZone } from "@/lib/time-zone";
import { NOTIFICATIONS_ANCHOR, settingsCopy } from "./_data";
import { AppearanceRow } from "./_components/appearance-row";
import { CurrencyRow } from "./_components/currency-row";
import { DeleteAccountRow } from "./_components/delete-account-row";
import { ExportRow } from "./_components/export-row";
import { NotificationsSection } from "./_components/notifications-section";
import { PlanSection } from "./_components/plan-section";
import { ProfileSection } from "./_components/profile-section";
import { SettingsSection } from "./_components/settings-section";
import { SignOutButton } from "./_components/sign-out-button";

export const metadata: Metadata = { title: settingsCopy.metaTitle };

const FALLBACK_TIME_ZONE = "UTC";

export default async function SettingsPage() {
  const { session, person } = await requireAppContext(routes.settings);
  const { user } = session;
  const timeZone = (await cookieTimeZone()) ?? FALLBACK_TIME_ZONE;
  const [prefs, allowance, exportable, currency, deletable] = await Promise.all([
    getNotificationPrefs(person.id),
    getAllowance(person.id, timeZone),
    exportGroups(person.id),
    getDefaultCurrency(person.id),
    getDeleteStatus(person.id),
  ]);
  const { sections } = settingsCopy;

  return (
    <div className="grid gap-7 px-5 pt-7 pb-10">
      <h1 className="m-0 text-heading">{settingsCopy.title}</h1>
      <SettingsSection copy={sections.profile}>
        <ProfileSection
          initial={{
            displayName: person.displayName,
            buddy: buddyShapeFor(person.displayName, person.buddy),
            tint: person.tint,
          }}
          username={user.username ?? null}
          email={user.email}
          verified={user.emailVerified}
        />
      </SettingsSection>
      <SettingsSection copy={sections.plan}>
        <PlanSection allowance={allowance} />
      </SettingsSection>
      <SettingsSection copy={sections.notifications} id={NOTIFICATIONS_ANCHOR} rows>
        <NotificationsSection initial={prefs} />
      </SettingsSection>
      <SettingsSection copy={sections.preferences} rows>
        <AppearanceRow />
        <CurrencyRow initial={currency} />
      </SettingsSection>
      <SettingsSection copy={sections.account} rows>
        <SignOutButton />
        <ExportRow groups={exportable} today={localDay(timeZone)} />
        <DeleteAccountRow initial={deletable} exportGroups={exportable} today={localDay(timeZone)} />
      </SettingsSection>
    </div>
  );
}
