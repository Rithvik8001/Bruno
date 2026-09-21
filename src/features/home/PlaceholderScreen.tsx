import { Gap, Screen, T } from "@/design";

import { homeCopy } from "./copy";

export type PlaceholderScreenProps = {
  title: string;
};

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <Screen scroll withTabBar>
      <T style="title">{title}</T>
      <Gap size="s16" />
      <T style="body" color="ink2">
        {homeCopy.placeholder}
      </T>
    </Screen>
  );
}
