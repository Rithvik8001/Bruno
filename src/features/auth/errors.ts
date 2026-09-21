import { Alert } from "react-native";

import type { AuthFailure } from "./api";
import { authCopy } from "./copy";

export function failureMessage(reason: AuthFailure): string {
  switch (reason) {
    case "invalid":
      return authCopy.errors.invalidEmail;
    case "invalidCode":
      return authCopy.errors.invalidCode;
    case "rateLimited":
      return authCopy.errors.rateLimited;
    case "network":
      return authCopy.errors.network;
    case "unknown":
      return authCopy.errors.generic;
  }
}

export function alertFailure(reason: AuthFailure): void {
  Alert.alert(authCopy.errors.alertTitle, failureMessage(reason), [
    { text: authCopy.errors.dismiss },
  ]);
}
