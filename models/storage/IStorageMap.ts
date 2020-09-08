import { IChatRoomCharacter, IChatRoomSearchResult, IStoredPlayer, ISettings } from 'models';
import { IMember } from 'models/database';

export const GLOBAL_STORAGE_KEYS = [
  'settings'
] as const;

export const STORAGE_KEYS = [
  'chatRoomCharacter',
  'chatRoomSearchResult',
  'onlineFriends',
  'player'
] as const;

export type GlobalStorageKeys = typeof GLOBAL_STORAGE_KEYS[number];
export type StorageKeys = typeof STORAGE_KEYS[number];

export interface IGlobalStorageMap {
  'settings': ISettings;
}

export interface IStorageMap {
  'chatRoomCharacter': IChatRoomCharacter[];
  'chatRoomSearchResult': IChatRoomSearchResult[];
  'onlineFriends': IMember[];
  'player': IStoredPlayer;
}
