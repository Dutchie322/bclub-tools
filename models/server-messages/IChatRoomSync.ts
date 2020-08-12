import { IChatRoomCharacter } from '../game';

export interface IChatRoomSync {
  Name: string;
  Description: string;
  Admin: string[];
  Ban: string[];
  Background: string;
  Limit: number;
  SourceMemberNumber: number;
  Locked: boolean;
  Private: boolean;
  Character: IChatRoomCharacter[];
}
