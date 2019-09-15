/// <reference types="@types/socket.io"/>

import { IChatRoom, CurrentScreen, IPlayer } from '../../../models/game';

declare global {
  interface Window {
    ChatRoomData: IChatRoom;
    CurrentScreen: CurrentScreen;
    Player: IPlayer;
    ServerSocket: SocketIO.Server;
  }
}
