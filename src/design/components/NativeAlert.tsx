import { Alert, Button, Host, Text } from "@expo/ui/swift-ui";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { layout, motion } from "../tokens";

export type NativeAlertAction = {
  title: string;
  role?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

export type NativeAlertProps = {
  visible: boolean;
  title: string;
  message?: string;
  actions: readonly NativeAlertAction[];
  onDismiss: () => void;
};

export function NativeAlert({
  visible,
  title,
  message,
  actions,
  onDismiss,
}: NativeAlertProps) {
  return (
    <Host
      pointerEvents="none"
      style={{
        position: "absolute",
        width: layout.nativeAlert.host,
        height: layout.nativeAlert.host,
      }}
    >
      <Alert
        title={title}
        isPresented={visible}
        onIsPresentedChange={(presented) => {
          if (!presented) {
            onDismiss();
          }
        }}
      >
        <Alert.Trigger>
          <Text>{""}</Text>
        </Alert.Trigger>
        <Alert.Actions>
          {actions.map((action) => (
            <Button
              key={action.title}
              label={action.title}
              role={action.role}
              onPress={action.onPress}
            />
          ))}
        </Alert.Actions>
        {message === undefined ? null : (
          <Alert.Message>
            <Text>{message}</Text>
          </Alert.Message>
        )}
      </Alert>
    </Host>
  );
}

export type NativeAlertConfig = {
  title: string;
  message?: string;
  actions: readonly NativeAlertAction[];
};

export function useNativeAlert(): {
  alert: ReactNode;
  show: (config: NativeAlertConfig) => void;
} {
  const [queue, setQueue] = useState<readonly NativeAlertConfig[]>([]);
  const [presentation, setPresentation] = useState(0);
  const [visible, setVisible] = useState(false);
  const dismissedAt = useRef(0);
  const current = queue[0];

  useEffect(() => {
    if (current === undefined || visible) {
      return;
    }
    const elapsed = Date.now() - dismissedAt.current;
    const timer = setTimeout(
      () => setVisible(true),
      Math.max(0, motion.duration.alertGap - elapsed),
    );
    return () => clearTimeout(timer);
  }, [current, visible]);

  const show = (config: NativeAlertConfig) => {
    setQueue((pending) => [...pending, config]);
  };

  const dismiss = () => {
    dismissedAt.current = Date.now();
    setVisible(false);
    setPresentation((value) => value + 1);
    setQueue((pending) => pending.slice(1));
  };

  const alert =
    current === undefined ? null : (
      <NativeAlert
        key={presentation}
        visible={visible}
        title={current.title}
        message={current.message}
        actions={current.actions}
        onDismiss={dismiss}
      />
    );

  return { alert, show };
}
