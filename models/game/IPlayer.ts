import { IOwnership } from '../game/IOwnership';
import { ILovership } from '../game/ILovership';

export interface IPlayer {
  AccountName: string;
  ChatSettings: IPlayerChatSettings;
  OnlineSettings: IPlayerOnlineSettings;
  MemberNumber: number;
  Name: string;
  FriendList: number[];
  FriendNames: Map<number, string>;
  Lovership: ILovership[];
  Ownership?: IOwnership;
  OnlineID: string;
}

export interface IPlayerChatSettings {
  DisplayTimestamps: boolean;
  ColorNames: boolean;
  ColorActions: boolean;
  ColorActivities: boolean;
  ColorEmotes: boolean;
  ShowActivities: boolean;
  ShowAutomaticMessages: boolean;
  WhiteSpace: '' | 'Preserve';
  ColorTheme: 'Light' | 'Dark';
  EnterLeave: 'Normal' | 'Smaller' | 'Hidden';
  MemberNumbers: 'Always' | 'Never' | 'OnMouseover';
  /**
   * @deprecated Moved to OnlineSettings as of R61
   */
  AutoBanGhostList: boolean;
  /**
   * @deprecated Moved to OnlineSettings as of R61
   */
  AutoBanBlackList: boolean;
  /**
   * @deprecated Moved to OnlineSettings as of R61
   */
  SearchShowsFullRooms: boolean;
  /**
   * @deprecated Moved to OnlineSettings as of R61
   */
  SearchFriendsFirst: boolean;
}

export interface IPlayerOnlineSettings {
  AutoBanGhostList: boolean;
  AutoBanBlackList: boolean;
  SearchShowsFullRooms: boolean;
  SearchFriendsFirst: boolean;
  DisableAnimations: boolean;
  EnableAfkTimer: boolean;
  EnableWardrobeIcon: boolean;
  AllowFullWardrobeAccess: boolean;
  BlockBodyCosplay: boolean;
}
