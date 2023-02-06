import { Socket } from 'socket.io-client';
import { ChatRoomSpace, CurrentScreen, IChatRoom, IPlayer } from '../../../models/game';

declare global {
  var ChatRoomData: IChatRoom;
  var ChatRoomSpace: ChatRoomSpace;
  var ChatSearchResultOffset: number;
  var CurrentScreen: CurrentScreen;
  var CharacterAppearanceReturnRoom: CurrentScreen;
  var InformationSheetPreviousScreen: CurrentScreen;
  var Player: IPlayer;
  var ServerSocket: Socket;

  var CommonDrawAppearanceBuild: (C: any, callbacks: object) => void;
}
