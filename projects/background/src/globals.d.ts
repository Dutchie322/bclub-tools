import type { Socket } from 'socket.io-client';
import type { EventNames, EventParams } from "@socket.io/component-emitter";
import type { ChatRoomSpace, CurrentScreen, IChatRoom, IPlayer } from '../../../models/game';

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
  declare function ServerSend<Ev extends EventNames<ClientToServerEvents>>(Message: Ev, ...args: EventParams<ClientToServerEvents, Ev>): void;
}
