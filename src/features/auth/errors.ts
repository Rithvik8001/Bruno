import type { AuthFailure } from "./api";
import { authCopy } from "./copy";

export function failureMessage(reason: AuthFailure): string {
  switch (reason) {
    case "invalid":
      return authCopy.errors.invalidEmail;
    case "invalidCode":
      return authCopy.errors.invalidCode;
    case "invalidCredentials":
      return authCopy.errors.invalidCredentials;
    case "rateLimited":
      return authCopy.errors.rateLimited;
    case "network":
      return authCopy.errors.network;
    case "unverified":
    case "unknown":
      return authCopy.errors.generic;
  }
}
