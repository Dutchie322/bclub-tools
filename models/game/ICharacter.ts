export interface IChatRoomCharacter {
  ActivePose: 'Kneel' | undefined;
  Appearance: IChatRoomAppearance[];
  AssetFamily: 'Female3DCG';
  Creation: number;
  ID: number;
  ItemPermission: number;
  Inventory: IChatRoomInventoryItem[];
  LabelColor: string;
  Lover: string;
  MemberNumber: number;
  Name: string;
  Owner: string;
  Ownership: IOwnership | null;
  Reputation: IReputation[];
}

export interface IChatRoomAppearance {
  Color: string;
  Group: string;
  Name: string;
}

export interface IChatRoomInventoryItem {
  Name: string;
  Group: string;
}

export interface IOwnership {
  MemberNumber: number;
  Name: string;
  /**
   * 0 = trial
   * 1 = collared
   */
  Stage: number;
  Start: number;
  StartTrialOfferedByMemberNumber: number;
  EndTrialOfferedByMemberNumber: number;
}

export interface IReputation {
  Type: 'Kidnap' | 'Maid' | 'Dominant' | 'Gambling';
  Value: number;
}
