export interface IMember {
  memberNumber: number;
  memberName: string;
  type: 'Member' | 'Friend' | 'Submissive' | 'Lover' | 'Owner';
  creation?: number;
  title?: string;
  description?: string;
  labelColor?: string;
  lovership?: IMemberLovership[];
  ownership?: IMemberOwnership;
  lastSeen: number;
}

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
