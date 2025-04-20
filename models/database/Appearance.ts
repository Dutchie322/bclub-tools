export interface Appearance {
  contextMemberNumber: number;
  memberNumber: number;
  appearance: string;
  appearanceMetaData?: AppearanceMetaData;
  timestamp: Date;
}

export interface AppearanceMetaData {
  canvasHeight: number;
  heightModifier: number;
  heightRatio: number;
  heightRatioProportion: number;
  isInverted: boolean;
}
