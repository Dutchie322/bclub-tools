import { ChatRoomMessageType } from 'models';

export interface IChatLog {
  chatRoom: string;
  content: string;
  characters?: IChatMessageCharacters;
  dictionary?: ChatMessageDictionary;
  id?: number;
  sender: IChatSender;
  session: IChatSessionPerspective;
  target?: IWhisperTarget;
  timestamp: Date;
  type: ChatRoomMessageType;
}

export interface IChatMessageCharacters {
  SourceCharacter?: IChatMessageCharacter;
  TargetCharacter?: IChatMessageCharacter;
}

export interface IChatMessageCharacter {
  Name: string;
  Nickname?: string;
  MemberNumber: number;
  Pronouns: string;
  HasPenis: boolean;
  HasVagina: boolean;
}

export interface IChatSender {
  id: number;
  name: string;
  nickname?: string;
  color: string;
}

export interface IChatSessionPerspective {
  id: string;
  name: string;
  nickname?: string;
  memberNumber: number;
}

export interface IWhisperTarget {
  name: string;
  memberNumber: number;
}
