import { IStorageMap, StorageKeys, GlobalStorageKeys, IGlobalStorageMap, CHARACTER_STORAGE_KEYS, ALL_STORAGE_KEYS } from './IStorageMap';

export async function retrieveGlobal<K extends GlobalStorageKeys>(key: K): Promise<IGlobalStorageMap[K]> {
  return (await chrome.storage.local.get([key]))[key] || {} as IGlobalStorageMap[K];
}

export async function retrieve<K extends StorageKeys>(tabId: number, key: K): Promise<IStorageMap[K] | undefined> {
  const storageKey = `${key}_${tabId}`;
  return (await chrome.storage.local.get([storageKey]))[storageKey];
}

export async function storeGlobal<K extends GlobalStorageKeys>(key: K, data: IGlobalStorageMap[K]) {
  await chrome.storage.local.set({
    [key]: data
  });
  return data;
}

export async function store<K extends StorageKeys>(tabId: number, key: K, data: IStorageMap[K]) {
  await chrome.storage.local.set({
    [`${key}_${tabId}`]: data
  });
  return data;
}

type TabStorageChange = { [K in StorageKeys]?: chrome.storage.StorageChange };

export function onChanged(
  tabId: number,
  callback: (changes: TabStorageChange, areaName: string) => void) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    const tabChanges: TabStorageChange = {};
    const suffix = `_${tabId}` as const;
    Object.keys(changes)
      .filter(key => key.endsWith(suffix))
      .forEach(key => tabChanges[key.substring(0, key.length - suffix.length)] = changes[key]);

    if (Object.keys(changes).length > 0) {
      callback(tabChanges, areaName);
    }
  });
}

export async function clearStorage(tabId: number) {
  await chrome.storage.local.remove(ALL_STORAGE_KEYS.map(key => `${key}_${tabId}`));
}

export async function clearCharacterStorage(tabId: number) {
  await chrome.storage.local.remove(CHARACTER_STORAGE_KEYS.map(key => `${key}_${tabId}`));
}
