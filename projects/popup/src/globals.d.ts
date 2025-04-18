import type { Socket } from 'socket.io-client';
import type { EventNames, EventParams } from "@socket.io/component-emitter";
import type { ChatRoomSpace, CurrentScreen, IChatRoom } from '../../../models/game';

declare global {
  let ChatRoomData: IChatRoom;
  let ChatRoomSpace: ChatRoomSpace;
  let ChatSearchResultOffset: number;
  let CurrentScreen: CurrentScreen;
  let CharacterAppearanceReturnRoom: CurrentScreen;
  let InformationSheetPreviousScreen: CurrentScreen;
  let ServerSocket: Socket;
  let ServerURL: string;

  let CommonDrawAppearanceBuild: (C: unknown, callbacks: object) => void;
  declare function ServerSend<Ev extends EventNames<ClientToServerEvents>>(Message: Ev, ...args: EventParams<ClientToServerEvents, Ev>): void;
}
