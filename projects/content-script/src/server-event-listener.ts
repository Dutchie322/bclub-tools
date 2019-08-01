/// <reference types="@types/socket.io"/>

import {
  generatePersistentScript,
  generatePersistentScriptWithWait
} from './script-generators';
import {
  IChatRoom,
  IChatRoomMessage,
  IPlayer,
  IEnrichedChatRoomMessage,
  IAccountBeep,
  IServerMessage,
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
generatePersistentScript(pollVariables);

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
    PlayerName: window.Player.Name,
    MemberNumber: window.Player.MemberNumber,
    Timestamp: new Date()
  } as IEnrichedChatRoomMessage));
  createForwarder<IChatRoomSync>('ChatRoomSync');
  createForwarder('disconnect');
  createForwarder('ForceDisconnect');

  // Retrieve online friends on login
  window.ServerSocket.on('LoginResponse', () => {
    window.ServerSocket.emit('AccountQuery', { Query: 'OnlineFriends' });
  });
}

function pollOnlineFriends() {
  setInterval(() => {
    if (window.CurrentScreen !== 'Login') {
      window.ServerSocket.emit('AccountQuery', { Query: 'OnlineFriends' });
    }
  }, 10000);
}

function pollVariables(handshake: string) {
  function sanitizeObject(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  setInterval(() => {
    window.postMessage({
      handshake,
      event: 'VariablesUpdate',
      data: {
        CurrentScreen: sanitizeObject(window.CurrentScreen),
        Player: sanitizeObject(window.Player)
      }
    }, '*');
  }, 1000);
}
