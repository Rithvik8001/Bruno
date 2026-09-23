import Storage from "expo-sqlite/kv-store";

const storageKey = "bruno.pushToken";

export function readStoredPushToken(): string | null {
  try {
    const stored = Storage.getItemSync(storageKey);
    return typeof stored === "string" && stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredPushToken(token: string | null): void {
  try {
    if (token === null) {
      Storage.removeItemSync(storageKey);
    } else {
      Storage.setItemSync(storageKey, token);
    }
  } catch {}
}
