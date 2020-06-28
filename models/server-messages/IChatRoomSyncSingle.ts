import { IChatRoomCharacter } from '../game';

export interface IChatRoomSyncSingle {
  Character: IChatRoomCharacter;
  SourceMemberNumber: number;
}
