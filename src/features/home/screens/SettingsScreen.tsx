import { openSettings } from "expo-linking";
import { router } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useState } from "react";

import {
  Divider,
  EmptyState,
  Gap,
  Group,
  IconRow,
  Loading,
  Screen,
  SectionHeading,
  SelectField,
  T,
  TextLink,
  ToggleRow,
  appearancePreferences,
  layout,
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
  formatHour,
  notificationsCopy,
  secondHourOptions,
  sendHourOptions,
  usePushStatus,
} from "@/features/notifications";
import {
  isNotificationFrequency,
  isReminderLeadDays,
  isSendHour,
  notificationFrequencies,
  reminderLeadOptions,
  useProfile,
  type NotificationFrequency,
  type ProfilePreferences,
} from "@/features/profile";
import { subscriptionsCopy } from "@/features/subscriptions";
import { logoDevHome } from "@/lib/logos";
import { currencyName } from "@/lib/money";

import { homeCopy } from "../copy";

const copy = homeCopy.settings;
const loadingRows = 10;

type LeadValue = `${(typeof reminderLeadOptions)[number]}`;

const leadOptions: readonly SelectOption<LeadValue>[] = reminderLeadOptions.map(
  (days) => ({
    value: `${days}` as LeadValue,
    label: copy.leadDays[`${days}`],
  }),
);

const frequencyOptions: readonly SelectOption<NotificationFrequency>[] =
  notificationFrequencies.map((value) => ({
    value,
    label: copy.frequencyOptions[value],
  }));

type HourValue = `${number}`;

function hourOptions(hours: readonly number[]): readonly SelectOption<HourValue>[] {
  return hours.map((hour) => ({
    value: `${hour}` as HourValue,
    label: formatHour(hour),
  }));
}

const sendOptions = hourOptions(sendHourOptions);

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
  const {
    permission,
    registered,
    registering,
    registrationError,
    requestPermission,
    retryRegistration,
    releaseDevice,
  } = usePushStatus();
  const [busy, setBusy] = useState(false);
  const email = session?.user.email;
  const granted = permission?.status === "granted";
  const pushOn = profile?.pushEnabled === true && granted;
  const pushHint =
    !pushOn || registered
      ? undefined
      : registering
        ? notificationsCopy.registering
        : notificationsCopy.unregistered(registrationError);

  const setPreference = (patch: Partial<ProfilePreferences>) => {
    void update(patch).then((result) => {
      if (!result.ok) {
        showFailure("unknown");
      }
    });
  };

  const togglePush = async (on: boolean) => {
    if (!on) {
      setPreference({ pushEnabled: false });
      return;
    }
    const current =
      permission?.status === "undetermined" ? await requestPermission() : permission;
    if (current?.status === "granted") {
      setPreference({ pushEnabled: true });
      retryRegistration();
      return;
    }
    if (current?.status === "denied" && !current.canAskAgain) {
      show({
        title: notificationsCopy.denied.title,
        message: notificationsCopy.denied.message,
        actions: [
          { title: notificationsCopy.denied.cancel, role: "cancel" },
          {
            title: notificationsCopy.denied.open,
            onPress: () => {
              void openSettings();
            },
          },
        ],
      });
    }
  };

  const setSendHour = (hour: number) => {
    if (profile === null) {
      return;
    }
    setPreference(
      profile.secondSendHour > hour
        ? { sendHour: hour }
        : { sendHour: hour, secondSendHour: hour + 1 },
    );
  };

  const signOutHere = () => {
    void releaseDevice().then(signOut);
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
      <SectionHeading top="s24" title={copy.reminders} />
      {status === "loading" ? (
        <Loading rows={loadingRows} />
      ) : profile === null ? (
        <EmptyState
          align="start"
          title={copy.loadErrorTitle}
          link={{ title: copy.retry, onPress: retry }}
        />
      ) : (
        <>
          <Group>
            <ToggleRow
              icon="bell"
              label={copy.renewalReminders}
              value={profile.renewalReminders}
              onValueChange={(value) =>
                setPreference({ renewalReminders: value })
              }
            />
            <ToggleRow
              icon="trial"
              label={copy.trialReminders}
              value={profile.trialReminders}
              onValueChange={(value) => setPreference({ trialReminders: value })}
            />
            <ToggleRow
              icon="calendar"
              label={copy.renewsToday}
              value={profile.renewsToday}
              onValueChange={(value) => setPreference({ renewsToday: value })}
            />
            <ToggleRow
              icon="note"
              label={copy.monthlyDigest}
              value={profile.monthlyDigest}
              onValueChange={(value) => setPreference({ monthlyDigest: value })}
            />
            <SelectField
              icon="clock"
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
          </Group>
          <Divider />
          <SectionHeading top={null} title={copy.delivery} />
          <Group>
            <ToggleRow
              icon="bell"
              label={copy.push}
              subtitle={pushHint}
              subtitleLines={3}
              value={pushOn}
              onValueChange={(value) => {
                void togglePush(value);
              }}
            />
            <ToggleRow
              icon="mail"
              label={copy.emailChannel}
              value={profile.emailEnabled}
              onValueChange={(value) => setPreference({ emailEnabled: value })}
            />
          </Group>
          <Divider />
          <SectionHeading top={null} title={copy.schedule} />
          <Group>
            <SelectField
              icon="repeat"
              label={copy.frequency}
              options={frequencyOptions}
              value={profile.notificationFrequency}
              onChange={(next) => {
                if (isNotificationFrequency(next)) {
                  setPreference({ notificationFrequency: next });
                }
              }}
            />
            <SelectField
              icon="clock"
              label={copy.time}
              options={sendOptions}
              value={`${profile.sendHour}` as HourValue}
              onChange={(next) => {
                const hour = Number(next);
                if (isSendHour(hour)) {
                  setSendHour(hour);
                }
              }}
            />
            {profile.notificationFrequency === "twice" ? (
              <SelectField
                icon="clock"
                label={copy.secondTime}
                options={hourOptions(
                  secondHourOptions.filter((hour) => hour > profile.sendHour),
                )}
                value={`${profile.secondSendHour}` as HourValue}
                onChange={(next) => {
                  const hour = Number(next);
                  if (isSendHour(hour) && hour > profile.sendHour) {
                    setPreference({ secondSendHour: hour });
                  }
                }}
              />
            ) : null}
          </Group>
        </>
      )}
      <Divider />
      <SectionHeading top={null} title={copy.appearance} />
      <Group>
        <SelectField
          icon="appearance"
          label={copy.theme}
          options={appearanceOptions}
          value={preference}
          onChange={setAppearance}
        />
      </Group>
      <Divider />
      <SectionHeading top={null} title={copy.account} />
      <Group>
        {profile === null ? null : (
          <IconRow
            icon="currency"
            title={copy.currency}
            value={profile.currency}
            valueNote={currencyName(profile.currency)}
            chevron
            onPress={() => router.push("/currency")}
          />
        )}
        {email === undefined ? null : (
          <IconRow icon="person" title={copy.email} subtitle={email} />
        )}
        <IconRow
          icon="signOut"
          title={copy.signOut}
          onPress={busy ? undefined : signOutHere}
        />
        <IconRow
          icon="trash"
          title={copy.deleteAccount}
          tone="ink2"
          onPress={busy ? undefined : askDelete}
        />
      </Group>
      <Divider />
      <TextLink
        size="note"
        title={subscriptionsCopy.logos.credit}
        onPress={() => {
          void openBrowserAsync(logoDevHome);
        }}
      />
      <Gap size="s16" />
      {alert}
    </Screen>
  );
}
