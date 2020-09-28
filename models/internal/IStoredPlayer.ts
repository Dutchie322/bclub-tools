import { IOwnership } from '../game/IOwnership';
import { ILovership } from '../game/ILovership';

export interface IStoredPlayer {
  MemberNumber: number;
  Name: string;
}

export interface IPlayerWithRelations extends IStoredPlayer {
  FriendList: number[];
  Lovership: ILovership[];
  Ownership?: IOwnership;
}