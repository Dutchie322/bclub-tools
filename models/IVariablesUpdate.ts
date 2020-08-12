import { ChatRoomSpace, CurrentScreen, IPlayer } from './game';

export interface IVariablesUpdate {
  ChatRoomSpace: ChatRoomSpace;
  CurrentScreen: CurrentScreen;
  Player: IPlayer;
  InChat: boolean;
}
