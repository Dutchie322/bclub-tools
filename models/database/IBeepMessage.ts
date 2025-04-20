export interface IBeepMessage {
  id: number;
  contextMemberNumber: number;
  direction: 'Incoming' | 'Outgoing';
  memberNumber: number;
  memberName: string;
  message: string;
  timestamp: Date;
}
