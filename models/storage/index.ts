import { IPlayer } from 'models/game';
import { IAccountQueryResultItem } from 'models';

export interface IStorageMap {
  'online_friends': IAccountQueryResultItem[];
  'player': IPlayer;
}

export function retrieve<K extends keyof IStorageMap>(tabId: number, key: K): Promise<IStorageMap[K] | undefined> {
  return new Promise(resolve => {
    const storageKey = `${key}_${tabId}`;
    chrome.storage.local.get([storageKey], data => resolve(data[storageKey]));
  });
}

export function store<K extends keyof IStorageMap>(tabId: number, key: K, data: IStorageMap[K]) {
  chrome.storage.local.set({
    [`${key}_${tabId}`]: data
  });
}

export function clearStorage(tabId: number) {
  chrome.storage.local.remove([
    `online_friends_${tabId}`,
    `player_${tabId}`
  ]);
}
