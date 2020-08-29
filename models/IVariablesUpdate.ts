import { ChatRoomSpace, CurrentScreen } from './game';

export interface IVariablesUpdate {
  ChatRoomSpace: ChatRoomSpace;
  CurrentScreen: CurrentScreen;
  InChat: boolean;
}
