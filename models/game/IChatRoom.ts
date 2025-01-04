import { IChatRoomCharacter } from './ICharacter';

export interface IChatRoom {
  Admin?: number[];
  Background: string;
  Ban?: number[];
  Character: IChatRoomCharacter[];
  Description: string;
  Limit?: number;
  Locked?: boolean;
  Name: string;
  Private?: boolean;
  SourceMemberNumber?: number;
}
