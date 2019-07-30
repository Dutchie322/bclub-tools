import { ICharacter } from '../game';

export interface IChatRoomSync {
  Background: string;
  Character: ICharacter[];
  CreatorID: number;
  Name: string;
  SourceMemberNumber: number;
}
