export interface IOwnership {
  /**
   * Undefined in case of an NPC
   */
  MemberNumber?: number;
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
}
