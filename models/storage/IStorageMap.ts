import { IPlayer } from 'models/game';
import { IAccountQueryResultItem } from 'models';

export interface IStorageMap {
  'online_friends': IAccountQueryResultItem[];
  'player': IPlayer;
}
