import { ICharacter } from './ICharacter';

export interface IChatRoom {
  Background: string;
  Character: ICharacter[];
  CreatorID: number;
  Name: string;
  SourceMemberNumber: number;
}
