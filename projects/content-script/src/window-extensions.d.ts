/// <reference types="@types/socket.io"/>

import { ChatRoomSpace, CurrentScreen, IChatRoom, IPlayer } from '../../../models/game';

declare global {
  interface Window {
    ChatRoomData: IChatRoom;
    ChatRoomSpace: ChatRoomSpace;
    ChatSearchIgnoredRooms: string[];
    CurrentScreen: CurrentScreen;
    CharacterAppearanceReturnRoom: CurrentScreen;
    InformationSheetPreviousScreen: CurrentScreen;
    Player: IPlayer;
    ServerSocket: SocketIO.Server;
    TimerProcess: typeof TimerProcess;
    CommonDrawAppearanceBuild: (c: any, callbacks: object) => void;
  }
}
