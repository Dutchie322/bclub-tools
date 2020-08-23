import { IChatRoom } from '../game';

export interface IChatRoomChat {
  Content: string;
  Dictionary?: IChatRoomChatDictionary[];
  Target?: number;
  Type: ChatRoomChatType;
}

export interface IChatRoomChatDictionary {
  Tag: string;
  Text?: string | number;
  TextToLookUp?: string;
  MemberNumber?: number;
}

export type ChatRoomChatType = 'Chat' | 'Emote' | 'Whisper';

export interface IEnrichedChatRoomChat extends IChatRoomChat {
  ChatRoom: IChatRoom;
  PlayerName: string;
  Sender: number;
  SessionId: string;
  TargetName?: string;
  MemberNumber: number;
  Timestamp: string | Date;
}
