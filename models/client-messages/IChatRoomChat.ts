/// <reference path="../game/Messages.d.ts"/>

import { IChatRoom } from '../game';

export interface IChatRoomChat {
  Content: string;
  Dictionary?: ChatMessageDictionary;
  Target?: number;
  Type: ChatRoomChatType;
}

export type ChatRoomChatType = 'Chat' | 'Emote' | 'Whisper' | 'Hidden';

export interface IEnrichedChatRoomChat extends IChatRoomChat {
  ChatRoom: IChatRoom;
  PlayerName: string;
  Sender: number;
  SessionId: string;
  TargetName?: string;
  MemberNumber: number;
  Timestamp: string | Date;
}
