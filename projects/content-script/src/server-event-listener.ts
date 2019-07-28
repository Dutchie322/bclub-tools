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
  IChatRoomSync
} from '../../../models';

declare global {
  interface Window {
    ChatRoomData: IChatRoom;
    Player: IPlayer;
    ServerSocket: SocketIO.Server;
  }
}

generatePersistentScriptWithWait('ServerSocket', listenToServerEvents);

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
  createForwarder<IAccountBeep>('AccountQueryResult');
  createForwarder<IChatRoomMessage>('ChatRoomMessage', data => ({
    ...data,
    ChatRoom: window.ChatRoomData,
    SessionId: window.Player.OnlineID,
    LoginName: window.Player.AccountName,
    Timestamp: new Date()
  } as IEnrichedChatRoomMessage));
  createForwarder<IChatRoomSync>('ChatRoomSync');
  createForwarder<ILoginResponse>('LoginResponse');
}

function sendMessage() {
  // ServerSocket.emit(Message, Data);
  // friendslist: "AccountQuery", {Query: "OnlineFriends"}
}
