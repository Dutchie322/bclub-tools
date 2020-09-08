export interface IPlayer {
  AccountName: string;
  ChatSettings: IPlayerChatSettings;
  Lover: string;
  MemberNumber: number;
  Money: number;
  Name: string;
  OnlineID: string;
  Owner: string;
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
