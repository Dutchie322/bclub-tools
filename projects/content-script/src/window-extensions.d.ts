/// <reference types="@types/socket.io"/>

import { ChatRoomSpace, CurrentScreen, IChatRoom, IPlayer } from '../../../models/game';
import { IBondageClubTools } from '../../../models/extension';

declare global {
  interface Window {
    BondageClubTools: IBondageClubTools;
    ChatRoomData: IChatRoom;
    ChatRoomSpace: ChatRoomSpace;
    CurrentScreen: CurrentScreen;
    Player: IPlayer;
    ServerSocket: SocketIO.Server;
    TimerProcess: typeof TimerProcess;
  }
}
