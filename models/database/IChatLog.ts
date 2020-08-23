import { ChatRoomMessageType } from 'models';

export interface IChatLog {
  chatRoom: string;
  content: string;
  dictionary?: IChatLogDictionary[];
  sender: IChatSender;
  session: IChatSessionPerspective;
  target?: IWhisperTarget;
  timestamp: Date;
  type: ChatRoomMessageType;
}

export interface IChatLogDictionary {
  Tag: string;
  Text?: string | number;
  TextToLookUp?: string;
  MemberNumber?: number;
}

export interface IChatSender {
  id: number;
  name: string;
  color: string;
}

export interface IChatSessionPerspective {
  id: string;
  name: string;
  memberNumber: number;
}

export interface IWhisperTarget {
  name: string;
  memberNumber: number;
}
