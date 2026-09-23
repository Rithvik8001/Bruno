import Storage from "expo-sqlite/kv-store";

import { isListSort, type ListSort } from "./selectors";

const storageKey = "bruno.listSort";
const defaultSort: ListSort = "renewal";

export function readSortPreference(): ListSort {
  try {
    const stored = Storage.getItemSync(storageKey);
    return isListSort(stored) ? stored : defaultSort;
  } catch {
    return defaultSort;
  }
}

export function writeSortPreference(sort: ListSort): void {
  try {
    Storage.setItemSync(storageKey, sort);
  } catch {}
}
