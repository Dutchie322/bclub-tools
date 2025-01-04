import { IChatRoom } from '../game';

export interface IChatRoomMessage {
  Content: string;
  Dictionary?: ChatMessageDictionary;
  Sender: number;
  Type: ChatRoomMessageType;
}

export type ChatRoomMessageType = 'Chat' | 'Whisper' | 'Action' | 'Activity' | 'Emote' | 'ServerMessage' | 'Hidden' | 'Status';

export interface IEnrichedChatRoomMessage extends IChatRoomMessage {
  ChatRoom: IChatRoom;
  PlayerName: string;
  PlayerNickname?: string;
  SessionId: string;
  MemberNumber: number;
  Timestamp: string | Date;
}
