import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";

import { layout, motion, radius } from "../tokens";
import { useReduceMotion } from "../theme/useAccessibility";
import { useTheme } from "../theme/useTheme";
import type { LogoSize } from "../types";
import { useTypeStyle } from "../typography";
import { T } from "../primitives/T";

export type LogoProps = {
  name: string;
  uri: string | null;
  size: LogoSize;
  muted?: boolean;
};

function initial(name: string): string {
  const first = Array.from(name.trim())[0];
  return first === undefined ? "" : first.toLocaleUpperCase();
}

export function Logo({ name, uri, size, muted = false }: LogoProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const [failed, setFailed] = useState<string | null>(null);
  const dimension = layout.logo[size];
  const letter = useTypeStyle("heading");
  const showImage = uri !== null && failed !== uri;

  return (
    <View
      accessible={false}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: radius.pill,
        backgroundColor: theme.surface,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: muted ? layout.disabledOpacity : 1,
      }}
    >
      <T
        style="heading"
        override={{
          fontSize: Math.round(dimension * layout.logo.letterScale),
          lineHeight: Math.round(dimension * layout.logo.letterScale * 1.2),
          fontFamily: letter.fontFamily,
          fontWeight: letter.fontWeight,
        }}
      >
        {initial(name)}
      </T>
      {showImage ? (
        <Image
          source={{ uri }}
          cachePolicy="memory-disk"
          recyclingKey={uri}
          contentFit="cover"
          transition={reduceMotion ? 0 : motion.duration.fade}
          onError={() => setFailed(uri)}
          accessible={false}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.canvas,
          }}
        />
      ) : null}
    </View>
  );
}
