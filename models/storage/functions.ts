import { IStorageMap, StorageKeys, STORAGE_KEYS } from './IStorageMap';

export function retrieve<K extends StorageKeys>(tabId: number, key: K): Promise<IStorageMap[K] | undefined> {
  return new Promise(resolve => {
    const storageKey = `${key}_${tabId}`;
    chrome.storage.local.get([storageKey], data => resolve(data[storageKey]));
  });
}

export function store<K extends StorageKeys>(tabId: number, key: K, data: IStorageMap[K]) {
  chrome.storage.local.set({
    [`${key}_${tabId}`]: data
  });
}

type TabStorageChange = { [K in StorageKeys]?: chrome.storage.StorageChange };

export function onChanged(
  tabId: number,
  callback: (changes: TabStorageChange, areaName: string) => void) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    const tabChanges: TabStorageChange = {};
    const suffix = `_${tabId}`;
    Object.keys(changes)
      .filter(key => key.endsWith(suffix))
      .forEach(key => tabChanges[key.substr(0, key.length - suffix.length)] = changes[key]);

    callback(tabChanges, areaName);
  });
}

export function clearStorage(tabId: number) {
  chrome.storage.local.remove(STORAGE_KEYS.map(key => `${key}_${tabId}`));
}
