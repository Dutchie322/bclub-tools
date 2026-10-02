export interface Appearance {
  contextMemberNumber: number;
  memberNumber: number;
  /**
   * The appearance image. New data is stored as a `Blob` (normally
   * `image/webp`), older data as a PNG data URL string.
   */
  appearance: Blob | string;
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
