export interface IMember {
  playerMemberNumber: number;
  playerMemberName: string;
  /**
   * @deprecated Functionality removed
   */
  type?: string;
  memberNumber: number;
  memberName?: string;
  nickname?: string;
  // Stylized nicknames make searching impossible, so we store a normalized one
  normalizedNickname?: string;
  lastSeen?: Date;
  chatRoomName?: string;
  chatRoomSpace?: string;
  isPrivateRoom?: boolean | undefined;
  creation?: Date;
  title?: string;
  dominant?: number;
  /**
   * @deprecated Moved to appearances store
   */
  appearance?: string;
  /**
   * @deprecated Moved to appearances store
   */
  appearanceMetaData?: IMemberAppearanceMetaData;
  description?: string;
  difficulty?: number;
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
