import { IChatRoomCharacter, IStoredPlayer, ISettings, IMigration } from 'models';
import { IMember } from 'models/database';

export const GLOBAL_STORAGE_KEYS = [
  'migration',
  'settings'
] as const;

export const STORAGE_KEYS = [
  'chatRoomCharacter',
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
  'onlineFriends': IMember[];
  'player': IStoredPlayer;
}
