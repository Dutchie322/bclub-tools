export interface IAppearance {
  Asset?: { Group: { Name: string }; Name: string; };
  Group?: string;
  Name: string;
  Color?: string;
  Difficulty?: number;
  Property?: IAppearanceProperty;
  Craft?: any;
}

export interface IAppearanceProperty {
  Block?: string[];
  Effect?: string[];
  Expression?: string;
  /**
   * Name of the specific lock used
   */
  LockedBy?: string;
  LockMemberNumber?: number;
  CombinationNumber?: string;
  /**
   * Remove item after timer runs out
   */
  RemoveItem?: boolean;
  /**
   * Whether to show the time left on the timer
   */
  ShowTimer?: boolean;
  /**
   * Allow others to increase or decrease the time
   */
  EnableRandomInput?: boolean;
  /**
   * Members who have already interacted with the random input on the timer
   */
  MemberNumberList?: number[];
  /**
   * The end timer of the timer
   */
  RemoveTimer?: number;
  /**
   * Specifies the variation of the item used
   */
  Restrain?: string;
  /**
   * Specifies the variation of the item used
   */
  Type?: string;
}
