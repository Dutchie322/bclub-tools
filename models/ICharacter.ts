export interface ICharacter {
  ActivePose: 'Kneel' | undefined;
  Appearance: IAppearance[];
  AssetFamily: 'Female3DCG';
  Creation: number;
  ID: number;
  ItemPermission: number;
  LabelColor: string;
  Lover: string;
  MemberNumber: number;
  Name: string;
  Owner: string;
  Ownership: IOwnership | null;
  Reputation: IReputation[];
}

export interface IAppearance {
  Color: string;
  Group: string;
  Name: string;
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
}

export interface IReputation {
  Type: 'Kidnap' | 'Maid' | 'Dominant' | 'Gambling';
  Value: number;
}
