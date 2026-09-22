import {
  Gap,
  Screen,
  SectionHeader,
  SettingsRow,
  T,
  TextLink,
} from "@/design";
import { signOut, useSession } from "@/features/auth";

import { homeCopy } from "../copy";

const copy = homeCopy.settings;

export function SettingsScreen() {
  const { session } = useSession();
  const email = session?.user.email;

  return (
    <Screen scroll withTabBar>
      <T style="title">{copy.title}</T>
      {email === undefined ? null : (
        <>
          <SectionHeader top="s24" label={copy.account} />
          <SettingsRow label={copy.email} value={email} chevron={false} last />
        </>
      )}
      <Gap size="s36" />
      <TextLink title={copy.signOut} onPress={signOut} />
    </Screen>
  );
}
