import { Server } from 'socket.io';
import { ChatRoomSpace, CurrentScreen, IChatRoom, IPlayer } from '../../../models/game';

declare global {
  var ChatRoomData: IChatRoom;
  var ChatRoomSpace: ChatRoomSpace;
  var ChatSearchIgnoredRooms: string[];
  var CurrentScreen: CurrentScreen;
  var CharacterAppearanceReturnRoom: CurrentScreen;
  var InformationSheetPreviousScreen: CurrentScreen;
  var MainCanvas: CanvasRenderingContext2D;
  var Player: IPlayer;
  var ServerSocket: Server;

  var CharacterRefresh: (C: any, Push?: boolean) => void;
  var CommonDrawAppearanceBuild: (C: any, callbacks: object) => void;
  var TimerProcess: (Timestamp: number) => void;
}
