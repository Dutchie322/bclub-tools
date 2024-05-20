import { Socket } from 'socket.io-client';
import { ChatRoomSpace, CurrentScreen, IChatRoom, IPlayer } from '../../../models/game';

declare global {
  let ChatRoomData: IChatRoom;
  let ChatRoomSpace: ChatRoomSpace;
  let ChatSearchResultOffset: number;
  let CurrentScreen: CurrentScreen;
  let CharacterAppearanceReturnRoom: CurrentScreen;
  let InformationSheetPreviousScreen: CurrentScreen;
  let Player: IPlayer;
  let ServerSocket: Socket;

  let CommonDrawAppearanceBuild: (C: unknown, callbacks: object) => void;
}
