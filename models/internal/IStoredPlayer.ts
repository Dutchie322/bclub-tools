import { IOwnership } from '../game/IOwnership';
import { ILovership } from '../game/ILovership';

export interface IStoredPlayer {
  AccountName: string;
  MemberNumber: number;
  Name: string;
  FriendList: number[];
  Lovership: ILovership[];
  Ownership?: IOwnership;
}
