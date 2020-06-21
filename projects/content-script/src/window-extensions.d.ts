/// <reference types="@types/socket.io"/>

import { ChatRoomSpace, CurrentScreen, IChatRoom, IPlayer } from '../../../models/game';

declare global {
  interface Window {
    ChatRoomData: IChatRoom;
    ChatRoomSpace: ChatRoomSpace;
    CurrentScreen: CurrentScreen;
    Player: IPlayer;
    ServerSocket: SocketIO.Server;
    TimerProcess: typeof TimerProcess;
  }
}
