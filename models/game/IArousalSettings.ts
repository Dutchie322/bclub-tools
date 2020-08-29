export interface IArousalSettings {
  Active: string;
  Visible: string;
  ShowOtherMeter: boolean;
  AffectExpression: boolean;
  AffectStutter: string;
  Progress: number;
  ProgressTimer: number;
  Activity: IArousalActivity[];
  Zone: IArousalZone[];
  OrgasmTimer: number;
  OrgasmStage: number;
}

export interface IArousalActivity {
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

export interface IArousalZone {
  Name: string;
  Factor: number;
  Orgasm: boolean;
}
