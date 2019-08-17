import { IChatRoomCharacter } from '../game';

export interface IChatRoomSync {
  Background: string;
  Character: IChatRoomCharacter[];
  CreatorID: number;
  Name: string;
  SourceMemberNumber: number;
}
