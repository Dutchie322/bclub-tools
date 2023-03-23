import { IChatRoom } from '../game';

export interface IChatRoomMessage {
  Content: string;
  Dictionary?: IChatRoomMessageDictionary[];
  Sender: number;
  Type: ChatRoomMessageType;
}

export interface IChatRoomMessageDictionary {
  Tag: string;
  Text?: string | number;
  TextToLookUp?: string;
  MemberNumber?: number;
}

export type ChatRoomMessageType = 'Chat' | 'Whisper' | 'Action' | 'Activity' | 'Emote' | 'ServerMessage' | 'Hidden' | 'Status';

export interface IEnrichedChatRoomMessage extends IChatRoomMessage {
  ChatRoom: IChatRoom;
  PlayerName: string;
  SessionId: string;
  MemberNumber: number;
  Timestamp: string | Date;
}
