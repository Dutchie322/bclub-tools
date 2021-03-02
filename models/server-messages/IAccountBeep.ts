export interface IAccountBeep {
  BeepType: 'Leash' | null;
  ChatRoomName: string | null;
  ChatRoomSpace: string | null;
  MemberName: string;
  MemberNumber: number;
  Message: string;
}
