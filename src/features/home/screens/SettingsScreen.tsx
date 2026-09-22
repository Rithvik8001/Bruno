import { useState } from "react";

import {
  Gap,
  Screen,
  SectionHeader,
  SelectField,
  SettingsRow,
  T,
  ToggleRow,
  type SelectOption,
} from "@/design";
import {
  deleteAccount,
  signOut,
  useAuthAlert,
  useSession,
} from "@/features/auth";
import {
  isReminderLeadDays,
  reminderLeadOptions,
  useProfile,
  type ProfilePreferences,
} from "@/features/profile";

import { homeCopy } from "../copy";

const copy = homeCopy.settings;

type LeadValue = `${(typeof reminderLeadOptions)[number]}`;

const leadOptions: readonly SelectOption<LeadValue>[] = reminderLeadOptions.map(
  (days) => ({ value: `${days}` as LeadValue, label: copy.leadDays[`${days}`] }),
);

export function SettingsScreen() {
  const { session } = useSession();
  const { profile, update } = useProfile();
  const { alert, show, showFailure } = useAuthAlert();
  const [busy, setBusy] = useState(false);
  const email = session?.user.email;

  const setPreference = (patch: Partial<ProfilePreferences>) => {
    void update(patch).then((result) => {
      if (!result.ok) {
        showFailure("unknown");
      }
    });
  };

  const confirmDelete = async () => {
    setBusy(true);
    const result = await deleteAccount();
    setBusy(false);
    if (!result.ok) {
      showFailure(result.reason);
    }
  };

  const askDelete = () => {
    show({
      title: copy.deleteTitle,
      message: copy.deleteMessage,
      actions: [
        { title: copy.deleteCancel, role: "cancel" },
        {
          title: copy.deleteConfirm,
          role: "destructive",
          onPress: () => {
            void confirmDelete();
          },
        },
      ],
    });
  };

  return (
    <Screen scroll withTabBar>
      <T style="title">{copy.title}</T>
      {profile === null ? null : (
        <>
          <SectionHeader top="s24" label={copy.notifications} />
          <ToggleRow
            label={copy.renewalReminders}
            value={profile.renewalReminders}
            onValueChange={(value) => setPreference({ renewalReminders: value })}
            last={false}
          />
          <ToggleRow
            label={copy.trialReminders}
            value={profile.trialReminders}
            onValueChange={(value) => setPreference({ trialReminders: value })}
            last={false}
          />
          <ToggleRow
            label={copy.renewsToday}
            value={profile.renewsToday}
            onValueChange={(value) => setPreference({ renewsToday: value })}
            last={false}
          />
          <ToggleRow
            label={copy.monthlyDigest}
            value={profile.monthlyDigest}
            onValueChange={(value) => setPreference({ monthlyDigest: value })}
          />
          <Gap size="s16" />
          <SelectField
            label={copy.remindMe}
            options={leadOptions}
            value={`${profile.reminderLeadDays}` as LeadValue}
            onChange={(next) => {
              const days = Number(next);
              if (isReminderLeadDays(days)) {
                setPreference({ reminderLeadDays: days });
              }
            }}
            last
          />
        </>
      )}
      <SectionHeader top="s24" label={copy.account} />
      {email === undefined ? null : (
        <SettingsRow label={copy.email} value={email} chevron={false} />
      )}
      <SettingsRow
        label={copy.signOut}
        chevron={false}
        onPress={busy ? undefined : signOut}
      />
      <SettingsRow
        label={copy.deleteAccount}
        chevron={false}
        tone="ink2"
        last
        onPress={busy ? undefined : askDelete}
      />
      <Gap size="s36" />
      {alert}
    </Screen>
  );
}
