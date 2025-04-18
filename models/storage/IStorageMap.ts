import { IChatRoomCharacter, IStoredPlayer, ISettings, IMigration, IMaintenance } from 'models';
import { IMember } from 'models/database';

export const GLOBAL_STORAGE_KEYS = [
  'maintenance',
  'migration',
  'settings'
] as const;

export const CHARACTER_STORAGE_KEYS = [
  'chatRoomCharacter',
  'onlineFriends',
  'player'
] as const;

export const ALL_STORAGE_KEYS = [
  ...CHARACTER_STORAGE_KEYS,
  'handshake',
] as const;

export type GlobalStorageKeys = typeof GLOBAL_STORAGE_KEYS[number];
export type StorageKeys = typeof ALL_STORAGE_KEYS[number];

export interface IGlobalStorageMap {
  'maintenance': IMaintenance;
  'migration': IMigration;
  'settings': ISettings;
}

export interface IStorageMap {
  'chatRoomCharacter': IChatRoomCharacter[];
  'handshake': string;
  'onlineFriends': IMember[];
  'player': IStoredPlayer;
}
