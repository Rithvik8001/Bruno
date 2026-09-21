import { router } from "expo-router";
import type { ReactNode } from "react";

import { Gap, NavRow, Screen, Spacer, T, layout } from "@/design";

export type AuthShellProps = {
  title: string;
  body: ReactNode;
  children: ReactNode;
};

export function AuthShell({ title, body, children }: AuthShellProps) {
  return (
    <Screen
      scroll
      fill
      keyboard
      scrollViewProps={{ alwaysBounceVertical: false }}
    >
      <NavRow onBack={() => router.back()} />
      <Spacer height={layout.auth.navGap} />
      <T style="title">{title}</T>
      <Gap size="s16" />
      <T style="body" color="ink2">
        {body}
      </T>
      <Gap size="s56" />
      {children}
    </Screen>
  );
}
