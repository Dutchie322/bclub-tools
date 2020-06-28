import {
  IChatRoomMessage,
  IEnrichedChatRoomMessage,
  IAccountBeep,
  IServerMessage,
  IChatRoomSearchResult,
  IChatRoomSync,
  IChatRoomSyncSingle,
  IAccountQueryResult
} from '../../../models';

export function listenToServerEvents(handshake: string) {
  function createForwarder<TMessage>(event: string, enrichData?: (data: TMessage) => TMessage) {
    window.ServerSocket.on(event, (data: TMessage) => {
      window.postMessage({
        handshake,
        type: 'server',
        event,
        data: JSON.parse(JSON.stringify(enrichData ? enrichData(data) : data)),
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
  createForwarder<IChatRoomSyncSingle>('ChatRoomSyncSingle');
  createForwarder<IChatRoomSearchResult[]>('ChatRoomSearchResult');
  createForwarder('disconnect');
  createForwarder('ForceDisconnect');

  // Retrieve online friends on login
  window.ServerSocket.on('LoginResponse', () => {
    window.ServerSocket.emit('AccountQuery', { Query: 'OnlineFriends' });
  });
}

export function pollOnlineFriends() {
  setInterval(() => {
    if (window.CurrentScreen !== 'Login') {
      window.ServerSocket.emit('AccountQuery', {
        Query: 'OnlineFriends'
      });
    }
    if (window.CurrentScreen === 'ChatSearch') {
      const searchInput = document.getElementById('InputSearch') as HTMLInputElement;
      window.ServerSocket.emit('ChatRoomSearch', {
        Query: searchInput ? searchInput.value.toUpperCase().trim() : '',
        Space: window.ChatRoomSpace
      });
    }
  }, 10000);
}

export function pollVariables(handshake: string) {
  function sanitizeObject(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  setInterval(() => {
    window.postMessage({
      handshake,
      type: 'client',
      event: 'VariablesUpdate',
      data: {
        ChatRoomSpace: sanitizeObject(window.ChatRoomSpace),
        CurrentScreen: sanitizeObject(window.CurrentScreen),
        Player: sanitizeObject(window.Player)
      }
    }, '*');
  }, 1000);
}
