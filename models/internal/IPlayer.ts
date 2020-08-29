import { IOwnership } from '../game/IOwnership';
import { ILovership } from '../game/ILovership';

export interface IPlayer {
  AccountName: string;
  MemberNumber: number;
  Name: string;
  FriendList: number[];
  Lovership: ILovership[];
  Ownership?: IOwnership;
}
