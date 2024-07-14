import { IChatRoomCharacter, IStoredPlayer, ISettings, IMigration } from 'models';
import { IMember } from 'models/database';

export const GLOBAL_STORAGE_KEYS = [
  'lastMaintenanceRun',
  'migration',
  'settings'
] as const;

export const STORAGE_KEYS = [
  'chatRoomCharacter',
  'handshake',
  'onlineFriends',
  'player'
] as const;

export type GlobalStorageKeys = typeof GLOBAL_STORAGE_KEYS[number];
export type StorageKeys = typeof STORAGE_KEYS[number];

export interface IGlobalStorageMap {
  'lastMaintenanceRun': Date;
  'migration': IMigration;
  'settings': ISettings;
}

export interface IStorageMap {
  'chatRoomCharacter': IChatRoomCharacter[];
  'handshake': string;
  'onlineFriends': IMember[];
  'player': IStoredPlayer;
}
