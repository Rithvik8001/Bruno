import { useState } from "react";

import {
  EmptyState,
  Gap,
  ListRow,
  Loading,
  Screen,
  SectionLabel,
  SelectField,
  T,
  ToggleRow,
  appearancePreferences,
  useAppearance,
  type AppearancePreference,
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
const loadingRows = 5;

type LeadValue = `${(typeof reminderLeadOptions)[number]}`;

const leadOptions: readonly SelectOption<LeadValue>[] = reminderLeadOptions.map(
  (days) => ({
    value: `${days}` as LeadValue,
    label: copy.leadDays[`${days}`],
  }),
);

const appearanceOptions: readonly SelectOption<AppearancePreference>[] =
  appearancePreferences.map((value) => ({
    value,
    label: copy.appearanceOptions[value],
  }));

export function SettingsScreen() {
  const { session } = useSession();
  const { profile, status, retry, update } = useProfile();
  const { preference, setPreference: setAppearance } = useAppearance();
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
      <T style="title" accessibilityRole="header">
        {copy.title}
      </T>
      <SectionLabel top="s24" title={copy.notifications} />
      {status === "loading" ? (
        <Loading rows={loadingRows} />
      ) : profile === null ? (
        <EmptyState
          title={copy.loadErrorTitle}
          link={{ title: copy.retry, onPress: retry }}
        />
      ) : (
        <>
          <ToggleRow
            label={copy.renewalReminders}
            value={profile.renewalReminders}
            onValueChange={(value) =>
              setPreference({ renewalReminders: value })
            }
          />
          <ToggleRow
            label={copy.trialReminders}
            value={profile.trialReminders}
            onValueChange={(value) => setPreference({ trialReminders: value })}
          />
          <ToggleRow
            label={copy.renewsToday}
            value={profile.renewsToday}
            onValueChange={(value) => setPreference({ renewsToday: value })}
          />
          <ToggleRow
            label={copy.monthlyDigest}
            value={profile.monthlyDigest}
            onValueChange={(value) => setPreference({ monthlyDigest: value })}
          />
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
          />
        </>
      )}
      <SectionLabel title={copy.appearance} />
      <>
        <SelectField
          label={copy.theme}
          options={appearanceOptions}
          value={preference}
          onChange={setAppearance}
        />
      </>
      <SectionLabel title={copy.account} />
      <>
        {email === undefined ? null : (
          <ListRow title={copy.email} value={email} mono={false} />
        )}
        <ListRow title={copy.signOut} onPress={busy ? undefined : signOut} />
        <ListRow
          title={copy.deleteAccount}
          tone="ink2"
          onPress={busy ? undefined : askDelete}
        />
      </>
      <Gap size="s32" />
      {alert}
    </Screen>
  );
}
