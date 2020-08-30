export interface IMember {
  playerMemberNumber: number;
  playerMemberName: string;
  memberNumber: number;
  memberName: string;
  type: MemberType;
  creation?: number;
  title?: string;
  description?: string;
  labelColor?: string;
  lovership?: IMemberLovership[];
  ownership?: IMemberOwnership;
  lastSeen: Date;
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
