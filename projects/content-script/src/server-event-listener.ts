/// <reference types="@types/socket.io"/>

import { generatePersistentScriptWithWait } from './script-generators';
import {
  IChatRoom,
  IChatRoomMessage,
  IPlayer,
  IEnrichedChatRoomMessage,
  IAccountBeep,
  IServerMessage,
  ILoginResponse,
  IChatRoomSync,
  IAccountQueryResult,
  CurrentScreen
} from '../../../models';

declare global {
  interface Window {
    ChatRoomData: IChatRoom;
    CurrentScreen: CurrentScreen;
    Player: IPlayer;
    ServerSocket: SocketIO.Server;
  }
}

generatePersistentScriptWithWait('ServerSocket', listenToServerEvents);
generatePersistentScriptWithWait('ServerSocket', pollOnlineFriends);

function listenToServerEvents(handshake: string) {
  function createForwarder<TMessage>(event: string, enrichData?: (data: TMessage) => TMessage) {
    window.ServerSocket.on(event, (data: TMessage) => {
      window.postMessage({
        handshake,
        event,
        data: enrichData ? enrichData(data) : data
      } as IServerMessage<TMessage>, '*');
    });
  }

  createForwarder<IAccountBeep>('AccountBeep');
  createForwarder<IAccountQueryResult>('AccountQueryResult');
  createForwarder<IChatRoomMessage>('ChatRoomMessage', data => ({
    ...data,
    ChatRoom: window.ChatRoomData,
    SessionId: window.Player.OnlineID,
    LoginName: window.Player.AccountName,
    MemberNumber: window.Player.MemberNumber,
    Timestamp: new Date()
  } as IEnrichedChatRoomMessage));
  createForwarder<IChatRoomSync>('ChatRoomSync');
  createForwarder<ILoginResponse>('LoginResponse');
  createForwarder('disconnect');
  createForwarder('ForceDisconnect');
}

function pollOnlineFriends() {
  setInterval(() => {
    if (window.CurrentScreen !== 'Login') {
      window.ServerSocket.emit('AccountQuery', { Query: 'OnlineFriends' });
    }
  }, 10000);
}
