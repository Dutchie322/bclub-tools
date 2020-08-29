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
