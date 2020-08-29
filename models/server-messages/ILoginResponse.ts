import { IAppearance, IReputation, IOwnership, ILovership, IArousalSettings } from '../game';

export interface ILoginResponse {
  Name: string;
  AccountName: string;
  Money: number;
  Creation: number;
  MemberNumber: number;
  Appearance: IAppearance;
  AssetFamily: 'Female3DCG';
  ItemPermission: number;
  LabelColor: string;
  Log: object[];
  Skill: object[];
  Reputation: IReputation[];
  PrivateCharacter: object[];
  FriendList: number[];
  WhiteList: number[];
  WardrobeCharacterNames: string[];
  Ownership: IOwnership;
  Title: string;
  ChatSettings: object;
  Description: string;
  AudioSettings: object;
  GameplaySettings: object;
  VisualSettings: object;
  LastLogin: number;
  Lovership: ILovership[];
  ArousalSettings: IArousalSettings;
  BlockItems: object[];
  LARP: object;
  Game: object;
  LimitedItems: object[];
  GhostList: number[];
  BlackList: number[];
  ID: number;
  Environment: 'PROD' | 'DEV';
}
