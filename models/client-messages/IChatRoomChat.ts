import { IChatRoom } from '../game';

export interface IChatRoomChat {
  Content: string;
  Dictionary?: {};
  Target?: number;
  Type: ChatRoomChatType;
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
