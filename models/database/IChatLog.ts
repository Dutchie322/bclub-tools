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
  // Member number of the sender
  id: number;
  // Account name of the sender
  name: string;
  // Nickname of the sender
  nickname?: string;
  // Configured colour of the sender
  color: string;
}

export interface IChatSessionPerspective {
  // Generated ID by the server that changes with every login
  id: string;
  // Account name of the logged in character
  name: string;
  // Nickname of the logged in character
  nickname?: string;
  // The member number of the logged in character
  memberNumber: number;
}

export interface IWhisperTarget {
  name: string;
  memberNumber: number;
}
