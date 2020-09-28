import { ChatRoomSpace, CurrentScreen } from './game';
import { IStoredPlayer } from './internal';

export interface IVariablesUpdate {
  ChatRoomSpace?: ChatRoomSpace;
  CurrentScreen?: CurrentScreen;
  InChat?: boolean;
  Player?: IStoredPlayer;
}
