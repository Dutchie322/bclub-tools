import { IStorageMap, StorageKeys, STORAGE_KEYS, GlobalStorageKeys, IGlobalStorageMap } from './IStorageMap';

export function retrieveGlobal<K extends GlobalStorageKeys>(key: K): Promise<IGlobalStorageMap[K] | undefined> {
  return new Promise(resolve => {
    chrome.storage.local.get([key], data => resolve(data[key]));
  });
}

export function retrieve<K extends StorageKeys>(tabId: number, key: K): Promise<IStorageMap[K] | undefined> {
  return new Promise(resolve => {
    const storageKey = `${key}_${tabId}`;
    chrome.storage.local.get([storageKey], data => resolve(data[storageKey]));
  });
}

export function storeGlobal<K extends GlobalStorageKeys>(key: K, data: IGlobalStorageMap[K]) {
  return new Promise<IGlobalStorageMap[K]>(resolve => {
    chrome.storage.local.set({
      [key]: data
    }, () => {
      resolve(data);
    });
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

    if (Object.keys(changes).length > 0) {
      callback(tabChanges, areaName);
    }
  });
}

export function clearStorage(tabId: number) {
  chrome.storage.local.remove(STORAGE_KEYS.map(key => `${key}_${tabId}`));
}
