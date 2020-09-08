import { IOwnership } from '../game/IOwnership';
import { ILovership } from '../game/ILovership';

export interface IPlayer {
  AccountName: string;
  ChatSettings: IPlayerChatSettings;
  MemberNumber: number;
  Name: string;
  FriendList: number[];
  Lovership: ILovership[];
  Ownership?: IOwnership;
}

export interface IPlayerChatSettings {
  DisplayTimestamps: boolean;
  ColorNames: boolean;
  ColorActions: boolean;
  ColorEmotes: boolean;
  ShowActivities: boolean;
  AutoBanGhostList: boolean;
  AutoBanBlackList: boolean;
  SearchShowsFullRooms: boolean;
  SearchFriendsFirst: boolean;
}
