export interface IChatRoomCharacter {
  ID: number;
  Name: string;
  AssetFamily: 'Female3DCG';
  Title: string;
  Appearance: IChatRoomAppearance[];
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
  ArousalSettings: IChatRoomCharacterArousalSettings;
  WhiteList: any[];
  Game: any;
}

export interface IChatRoomAppearance {
  Group: string;
  Name: string;
  Color: string;
  Property?: IChatRoomAppearanceProperty;
}

export interface IChatRoomAppearanceProperty {
  Expression?: string;
  Restrain?: any;
}

export interface ILovership {
  MemberNumber: number;
  Name: string;
  /**
   * Timestamp
   */
  Start: number;
  /**
   * 0 = Dating
   * 1 = Engaged
   * 2 = Married
   */
  Stage: number;
}

export interface IChatRoomCharacterBlockItem {
  Name: string;
  Group: string;
}

export interface IChatRoomCharacterArousalSettings {
  Active: string;
  Visible: string;
  ShowOtherMeter: boolean;
  AffectExpression: boolean;
  AffectStutter: string;
  Progress: number;
  ProgressTimer: number;
  Activity: IChatRoomCharacterArousalActivity[];
  Zone: IChatRoomCharacterArousalZone[];
  OrgasmTimer: number;
  OrgasmStage: number;
}

export interface IChatRoomCharacterArousalActivity {
  Name: string;
  /**
   * 0 = Block
   * 1 = Dislike
   * 2 = Neutral
   * 3 = Like
   * 4 = Adore
   */
  Self: number;
  /**
   * 0 = Block
   * 1 = Dislike
   * 2 = Neutral
   * 3 = Like
   * 4 = Adore
   */
  Other: number;
}

export interface IChatRoomCharacterArousalZone {
  Name: string;
  Factor: number;
  Orgasm: boolean;
}

export interface IChatRoomInventoryItem {
  Name: string;
  Group: string;
}

export interface IOwnership {
  MemberNumber: number;
  Name: string;
  /**
   * 0 = Trial
   * 1 = Collared
   */
  Stage: number;
  /**
   * Timestamp
   */
  Start: number;
  StartTrialOfferedByMemberNumber: number;
  EndTrialOfferedByMemberNumber: number;
}

export interface IReputation {
  Type: 'Kidnap' | 'Maid' | 'Dominant' | 'Gambling' | 'ABDL' | 'Asylum' | 'LARP';
  /**
   * Range: 0-100
   */
  Value: number;
}
