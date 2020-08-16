import { IChatRoom } from '../game';

export interface IChatRoomMessage {
  Content: string;
  Dictionary?: {};
  Sender: number;
  Type: ChatRoomMessageType;
}

export type ChatRoomMessageType = 'Chat' | 'Whisper' | 'Action' | 'Emote' | 'ServerMessage';

export interface IEnrichedChatRoomMessage extends IChatRoomMessage {
  ChatRoom: IChatRoom;
  PlayerName: string;
  SessionId: string;
  MemberNumber: number;
  Timestamp: string | Date;
}
