export interface IMember {
  playerMemberNumber: number;
  playerMemberName: string;
  type: MemberType;
  memberNumber: number;
  memberName?: string;
  lastSeen?: Date;
  chatRoomName?: string;
  chatRoomSpace?: string;
  creation?: number;
  title?: string;
  description?: string;
  labelColor?: string;
  lovership?: IMemberLovership[];
  ownership?: IMemberOwnership;
}

export type MemberType = 'Member' | 'Friend' | 'Submissive' | 'Lover' | 'Owner';

export interface IMemberLovership {
  memberNumber: number;
  name: string;
  start: number;
  stage: number;
}

export interface IMemberOwnership {
  memberNumber: number;
  name: string;
  start: number;
  stage: number;
}
