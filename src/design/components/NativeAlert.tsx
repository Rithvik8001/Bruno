import { Alert, Button, Host, Text } from "@expo/ui/swift-ui";

import { layout } from "../tokens";

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
