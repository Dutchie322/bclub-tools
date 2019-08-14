import { IChatRoomCharacter } from './ICharacter';

export interface IChatRoom {
  Background: string;
  Character: IChatRoomCharacter[];
  CreatorID: number;
  Name: string;
  SourceMemberNumber: number;
}
