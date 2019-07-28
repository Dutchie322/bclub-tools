import { IChatRoom } from 'models/IChatRoom';

export interface IChatRoomMessage {
  Content: string;
  Sender: number;
  Type: 'Chat' | 'Whisper' | 'Action' | 'Emote' | 'ServerMessage';
}

export interface IEnrichedChatRoomMessage extends IChatRoomMessage {
  ChatRoom: IChatRoom;
  LoginName: string;
  SessionId: string;
  Timestamp: string | Date;
}
