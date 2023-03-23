import { IAppearance } from './IAppearance';
import { IArousalSettings } from './IArousalSettings';
import { ILovership } from './ILovership';
import { IOwnership } from './IOwnership';
import { IReputation } from './IReputation';

export interface IChatRoomCharacter {
  ID: number;
  Name: string;
  Nickname: string;
  AssetFamily: 'Female3DCG';
  Title: string;
  Appearance: IAppearance[];
  ActivePose: 'Kneel' | undefined;
  Reputation?: IReputation[];
  /**
   * Timestamp
   */
  Creation: number;
  Lovership: ILovership[];
  Description: string;
  Owner: string;
  MemberNumber: number;
  LabelColor: string;
  ItemPermission: number;
  /**
   * Encoded gibberish, can be quite long so it's best to skip it for performance reasons.
   */
  Inventory: string;
  Ownership: IOwnership | null;
  BlockItems: IChatRoomCharacterBlockItem[];
  ArousalSettings: IArousalSettings;
  WhiteList: any[];
  Game: any;
}

export interface IChatRoomCharacterBlockItem {
  Name: string;
  Group: string;
}

export interface IChatRoomInventoryItem {
  Name: string;
  Group: string;
}
