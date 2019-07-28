import { ICharacter } from 'models/ICharacter';

export interface IChatRoomSync {
  Background: string;
  Character: ICharacter[];
  CreatorID: number;
  Name: string;
  SourceMemberNumber: number;
}
