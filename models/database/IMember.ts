export interface IMember {
  playerMemberNumber: number;
  playerMemberName: string;
  /**
   * @deprecated Functionality removed
   */
  type: string;
  memberNumber: number;
  memberName?: string;
  lastSeen?: Date;
  chatRoomName?: string;
  chatRoomSpace?: string;
  isPrivateRoom?: boolean | undefined;
  creation?: Date;
  title?: string;
  dominant?: number;
  appearance?: string;
  appearanceMetaData?: IMemberAppearanceMetaData;
  description?: string;
  labelColor?: string;
  lovership?: IMemberLovership[];
  ownership?: IMemberOwnership;
  pronouns?: string;
  notes?: string;
}

export interface IMemberAppearanceMetaData {
  canvasHeight: number;
  heightModifier: number;
  heightRatio: number;
  heightRatioProportion: number;
  isInverted: boolean;
}

export interface IMemberLovership {
  memberNumber: number;
  name: string;
  start: Date;
  stage: number;
}

export interface IMemberOwnership {
  memberNumber: number;
  name: string;
  start: Date;
  stage: number;
}
