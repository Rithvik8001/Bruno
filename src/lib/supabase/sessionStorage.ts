import * as aesjs from "aes-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import Storage from "expo-sqlite/kv-store";

const keyBytes = 32;

async function encrypt(key: string, value: string): Promise<string> {
  const encryptionKey = Crypto.getRandomBytes(keyBytes);
  const cipher = new aesjs.ModeOfOperation.ctr(
    encryptionKey,
    new aesjs.Counter(1),
  );
  const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
  await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
  return aesjs.utils.hex.fromBytes(encrypted);
}

async function decrypt(key: string, value: string): Promise<string | null> {
  const encryptionKeyHex = await SecureStore.getItemAsync(key);
  if (encryptionKeyHex === null) {
    return null;
  }
  const cipher = new aesjs.ModeOfOperation.ctr(
    aesjs.utils.hex.toBytes(encryptionKeyHex),
    new aesjs.Counter(1),
  );
  const decrypted = cipher.decrypt(aesjs.utils.hex.toBytes(value));
  return aesjs.utils.utf8.fromBytes(decrypted);
}

export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const stored = await Storage.getItem(key);
      return stored === null ? null : await decrypt(key, stored);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    await Storage.setItem(key, await encrypt(key, value));
  },
  async removeItem(key: string): Promise<void> {
    await Storage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};
