import { IChatRoomCharacter, IChatRoomSearchResult, IStoredPlayer, ISettings, IMigration } from 'models';
import { IMember } from 'models/database';

export const GLOBAL_STORAGE_KEYS = [
  'migration',
  'settings'
] as const;

export const STORAGE_KEYS = [
  'chatRoomCharacter',
  'chatRoomSearchResult',
  'handshake',
  'onlineFriends',
  'player'
] as const;

export type GlobalStorageKeys = typeof GLOBAL_STORAGE_KEYS[number];
export type StorageKeys = typeof STORAGE_KEYS[number];

export interface IGlobalStorageMap {
  'migration': IMigration;
  'settings': ISettings;
}

export interface IStorageMap {
  'chatRoomCharacter': IChatRoomCharacter[];
  'chatRoomSearchResult': IChatRoomSearchResult[];
  'handshake': string;
  'onlineFriends': IMember[];
  'player': IStoredPlayer;
}
